package abubakar.bookapp.service;

import abubakar.bookapp.models.Book;
import abubakar.bookapp.models.Order;
import abubakar.bookapp.models.OrderItem;
import abubakar.bookapp.models.ReturnReplacement;
import abubakar.bookapp.repository.BookRepository;
import abubakar.bookapp.repository.ReturnReplacementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ReturnReplacementService {

    @Autowired
    private ReturnReplacementRepository repo;

    @Autowired
    private OrderService orderService;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private FileStorageService fileStorageService;

    // Create a new return/replacement request
    @Transactional
    public ReturnReplacement createRequest(ReturnReplacement rr, List<MultipartFile> images) {
        Order order = orderService.getOrderById(rr.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        // Allow only delivered orders
        if (!"Delivered".equalsIgnoreCase(order.getOrderStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Return & Replacement is allowed only for delivered products.");
        }

        OrderItem item = order.getItems().stream()
                .filter(i -> i.getBookId().equals(rr.getBookId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book not found in order"));

        // Quantity check
        if (item.getQuantity() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Return & Replacement is allowed only for products whose quantity is greater than zero.");
        }

        boolean exists = repo.existsByOrderIdAndBookIdAndStatusIn(
                rr.getOrderId(), rr.getBookId(), List.of("PENDING"));
        if (exists) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "You already have an active return/replacement request for this book.");
        }

        if (rr.getQuantity() == null || rr.getQuantity() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be greater than zero");
        }
        if (rr.getQuantity() > item.getQuantity()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Quantity cannot exceed ordered quantity (" + item.getQuantity() + ")");
        }

        rr.setCustomerName(order.getUserName());
        rr.setCustomerAddress(order.getAddress());
        rr.setCustomerPhone(order.getPhoneNumber());
        rr.setStatus("PENDING");
        rr.setRequestedDate(LocalDateTime.now());
        rr.setProcessedDate(null);
        rr.setDeliveryDate(rr.getDeliveryDate() != null ? rr.getDeliveryDate() : LocalDateTime.now().plusDays(3));

        // Handle file uploads
        if (images != null && !images.isEmpty()) {
            List<String> imageUrls = images.stream().map(file -> {
                try {
                    return fileStorageService.saveReturnReplacementImage(file, rr.getUserId(), rr.getOrderId(),
                            rr.getBookId());
                } catch (Exception e) {
                    throw new RuntimeException("Failed to upload one or more images:" + file.getOriginalFilename(), e);
                }
            }).toList();

            rr.setImageUrls(imageUrls);
        }

        return repo.save(rr);
    }

    public List<ReturnReplacement> getRequestsByUser(Long userId) {
        return repo.findByUserId(userId);
    }

    public Optional<ReturnReplacement> getRequestById(Long id) {
        return repo.findById(id);
    }

    // Edit a return/replacement request (by id)
    @Transactional
    public ReturnReplacement editRequest(Long returnId, ReturnReplacement updates, List<MultipartFile> images) {
        ReturnReplacement existing = repo.findById(returnId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Return/Replacement request not found"));

        String status = existing.getStatus() == null ? "" : existing.getStatus().toUpperCase();

        // Prevent editing finalized/processed requests
        if (List.of("APPROVED", "RETURNED", "REPLACED", "REFUNDED", "REJECTED").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot edit a request that is already " + status.toLowerCase() + ".");
        }

        // Editable simple fields
        if (updates.getCustomerName() != null)
            existing.setCustomerName(updates.getCustomerName());
        if (updates.getCustomerAddress() != null)
            existing.setCustomerAddress(updates.getCustomerAddress());
        if (updates.getCustomerPhone() != null)
            existing.setCustomerPhone(updates.getCustomerPhone());
        if (updates.getReason() != null)
            existing.setReason(updates.getReason());
        if (updates.getDeliveryDate() != null)
            existing.setDeliveryDate(updates.getDeliveryDate());

        try {
            // Delete removed images
            List<String> updatedImageUrls = updates.getImageUrls() != null ? updates.getImageUrls()
                    : existing.getImageUrls();
            List<String> imagesToDelete = existing.getImageUrls().stream()
                    .filter(url -> !updatedImageUrls.contains(url))
                    .toList();

            fileStorageService.deleteReturnReplacementImages(imagesToDelete);
            existing.setImageUrls(updatedImageUrls);

            if (images != null && !images.isEmpty()) {
                List<String> newUrls = fileStorageService.editReturnReplacementImages(
                        existing.getUserId(), existing.getOrderId(), existing.getBookId(),
                        List.of(), images);
                existing.getImageUrls().addAll(newUrls);
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error updating request images: " + e.getMessage());
        }

        // Save and return
        return repo.save(existing);
    }

    // delete a return/replacement request (by id).
    @Transactional
    public void deleteRequest(Long returnId) {
        // Fetch existing request
        ReturnReplacement rr = repo.findById(returnId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Return/Replacement request not found"));

        String status = rr.getStatus() == null ? "" : rr.getStatus().toUpperCase();

        // Block deletion for finalized/processed requests
        if (List.of("APPROVED", "RETURNED", "REPLACED", "REFUNDED", "REJECTED").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot delete a request that is already " + status.toLowerCase() + ".");
        }

        // Safely delete any associated files
        List<String> imageUrls = rr.getImageUrls() == null ? List.of() : rr.getImageUrls();
        try {
            fileStorageService.deleteReturnReplacementImages(imageUrls);
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to delete associated files: " + e.getMessage(), e);
        }

        // Delete the request (no stock/order changes needed for PENDING or
        // REJECTED)
        repo.delete(rr);
    }

    // Update status done by admin
    @Transactional
    public ReturnReplacement updateStatus(Long id, String status) {

        ReturnReplacement rr = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Request not found with id: " + id));

        String oldStatus = rr.getStatus() == null ? "" : rr.getStatus().toUpperCase();
        String newStatus = status == null ? "" : status.toUpperCase();

        // Prevent same status update
        if (oldStatus.equals(newStatus)) {
            return rr;
        }

        // Allow APPROVED only from PENDING
        if ("APPROVED".equals(newStatus) && !"PENDING".equals(oldStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only PENDING requests can be approved.");
        }

        // Prevent skipping approval
        if (("RETURNED".equals(newStatus) || "REPLACED".equals(newStatus))
                && !"APPROVED".equals(oldStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Request must be APPROVED before processing.");
        }

        // Do NOT process anything at APPROVED stage
        if ("APPROVED".equals(newStatus)) {
            rr.setStatus("APPROVED");
            rr.setProcessedDate(LocalDateTime.now());
            return repo.save(rr);
        }

        // Fetch order only when needed
        Order order = orderService.getOrderById(rr.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Order not found"));

        int qty = rr.getQuantity() == null ? 0 : rr.getQuantity();
        if (qty <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid quantity");
        }

        // ---------------- FINAL PROCESSING ----------------

        // RETURN FLOW
        if ("RETURNED".equals(newStatus)) {

            if (!"RETURN".equalsIgnoreCase(rr.getType())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "This request is not a RETURN type.");
            }

            adjustOrderForReturnOrReplacement(order, rr, qty);
        }

        // REPLACEMENT FLOW
        else if ("REPLACED".equals(newStatus)) {

            if (!"REPLACEMENT".equalsIgnoreCase(rr.getType())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "This request is not a REPLACEMENT type.");
            }

            checkReplacementStock(rr.getBookId(), qty);

            adjustOrderForReturnOrReplacement(order, rr, qty);

            decreaseBookStock(rr.getBookId(), qty);

            rr.setDeliveryDate(LocalDateTime.now().plusDays(3));
        }

        // REJECT FLOW (no processing needed)
        else if ("REJECTED".equals(newStatus)) {
            rr.setStatus("REJECTED");
            rr.setProcessedDate(LocalDateTime.now());
            return repo.save(rr);
        }

        else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid status transition.");
        }

        // Save updated order after processing
        orderService.saveOrder(order);

        // Update request
        rr.setStatus(newStatus);
        rr.setProcessedDate(LocalDateTime.now());

        return repo.save(rr);
    }

    // ---------------- Helper Methods ----------------
    /**
     * Adjusts order item quantity, subtotal, and recalculates total
     * for both RETURN and REPLACEMENT approval flows.
     */
    private void adjustOrderForReturnOrReplacement(Order order, ReturnReplacement rr, int qty) {

        order.getItems().stream()
                .filter(i -> i.getBookId().equals(rr.getBookId()))
                .findFirst()
                .ifPresent(orderItem -> {

                    int alreadyProcessed = orderItem.getReturnedQuantity()
                            + orderItem.getReplacedQuantity();

                    int remaining = orderItem.getQuantity() - alreadyProcessed;

                    if (qty > remaining) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Only " + remaining + " items available for return/replacement");
                    }

                    if ("RETURN".equalsIgnoreCase(rr.getType())) {
                        orderItem.setReturnedQuantity(
                                orderItem.getReturnedQuantity() + qty);
                    }

                    if ("REPLACEMENT".equalsIgnoreCase(rr.getType())) {
                        orderItem.setReplacedQuantity(
                                orderItem.getReplacedQuantity() + qty);
                    }

                    // Calculate effective quantity (for billing only)
                    int effectiveQty = orderItem.getQuantity()
                            - orderItem.getReturnedQuantity()
                            - orderItem.getReplacedQuantity();

                    if (effectiveQty < 0)
                        effectiveQty = 0;

                    orderItem.setSubtotal(orderItem.getUnitPrice() * effectiveQty);
                });

        // Recalculate order totals
        float subtotal = (float) order.getItems().stream()
                .mapToDouble(OrderItem::getSubtotal)
                .sum();

        float gst = subtotal * 0.05f;
        float total = subtotal + gst;

        order.setSubtotal(subtotal);
        order.setGst(gst);
        order.setTotal(total);
    }

    /**
     * Decreases the stock of a book (for REPLACEMENT cases).
     */
    private void decreaseBookStock(Long bookId, int qty) {
        if (bookId == null || qty <= 0)
            return;

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));

        if (book.getQuantity() < qty) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient stock for replacement");
        }

        book.setQuantity(book.getQuantity() - qty);
        bookRepository.save(book);
    }

    // print
    public ReturnReplacement getPrintableRequest(Long id) {
        ReturnReplacement rr = repo.findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found with ID: " + id));

        String status = rr.getStatus() == null ? "" : rr.getStatus().toUpperCase();

        if (List.of("PENDING", "APPROVED").contains(status)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Printing is not allowed for requests in '" + status.toLowerCase() + "' status.");
        }

        return rr;
    }

    public List<ReturnReplacement> getAllRequests() {
        return repo.findAll();
    }

    public List<ReturnReplacement> getRequestsByStatus(String status) {
        return repo.findByStatus(status);
    }

    public ReturnReplacement save(ReturnReplacement rr) {
        return repo.save(rr);
    }

    private void checkReplacementStock(Long bookId, int qty) {

        if (bookId == null || qty <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid replacement request");
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));

        if (book.getQuantity() < qty) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Replacement cannot be processed. Product is out of stock.");
        }
    }

}
