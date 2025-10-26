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

import java.io.IOException;
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

    /**
     * Create a new return/replacement request
     */
    @Transactional
    public ReturnReplacement createRequest(ReturnReplacement rr, List<MultipartFile> images) {
        Order order = orderService.getOrderById(rr.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        OrderItem item = order.getItems().stream()
                .filter(i -> i.getBookId().equals(rr.getBookId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book not found in order"));

        boolean exists = repo.existsByOrderIdAndBookIdAndStatusIn(
                rr.getOrderId(), rr.getBookId(), List.of("PENDING", "APPROVED"));
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
                    throw new RuntimeException("Failed to upload image: " + file.getOriginalFilename(), e);
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

    /**
     * Edit a return/replacement request (by id).
     */
    @Transactional
    public ReturnReplacement editRequest(Long returnId, ReturnReplacement updates, List<MultipartFile> images) {
        ReturnReplacement existing = repo.findById(returnId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Return/Replacement request not found"));

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

        // ---------------- Image handling ---------------- //
        List<String> updatedImageUrls = updates.getImageUrls() != null ? updates.getImageUrls()
                : existing.getImageUrls();

        // Delete removed images
        List<String> imagesToDelete = existing.getImageUrls().stream()
                .filter(url -> !updatedImageUrls.contains(url))
                .toList();

        fileStorageService.deleteReturnReplacementImages(imagesToDelete);

        existing.setImageUrls(updatedImageUrls);

        // If new files uploaded, add them
        if (images != null && !images.isEmpty()) {
            try {
                List<String> newUrls = fileStorageService.editReturnReplacementImages(
                        existing.getUserId(),
                        existing.getOrderId(),
                        existing.getBookId(),
                        List.of(), // we already deleted removed files, keep existing
                        images);
                existing.getImageUrls().addAll(newUrls);
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Failed to save new images: " + e.getMessage(), e);
            }
        }

        return repo.save(existing);
    }

    /**
     * Delete a return/replacement request by id.
     */
    @Transactional
    public void deleteRequest(Long returnId) {
        ReturnReplacement rr = repo.findById(returnId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Return/Replacement request not found"));

        // 1) delete associated files (safe even if imageUrls is null/empty)
        try {
            fileStorageService.deleteReturnReplacementImages(rr.getImageUrls());
        } catch (Exception e) {
            // don't silently swallow — wrap into a ResponseStatusException so
            // GlobalExceptionHandler formats it
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to delete associated files: " + e.getMessage(), e);
        }

        // 2) if RETURN and APPROVED -> adjust order item quantity (increase)
        if ("RETURN".equalsIgnoreCase(rr.getType()) && "APPROVED".equalsIgnoreCase(rr.getStatus())) {
            Order order = orderService.getOrderById(rr.getOrderId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Associated order not found"));

            order.getItems().stream()
                    .filter(i -> i.getBookId().equals(rr.getBookId()))
                    .findFirst()
                    .ifPresent(orderItem -> {
                        int updatedQty = orderItem.getQuantity() + (rr.getQuantity() != null ? rr.getQuantity() : 0);
                        orderItem.setQuantity(updatedQty);
                    });

            // save adjusted order (persist the change in order items)
            orderService.saveOrder(order);
        }

        // 3) finally delete the ReturnReplacement record
        repo.delete(rr);
    }

    /**
     * Update status — handled by admin actions
     */
    @Transactional
    public ReturnReplacement updateStatus(Long id, String status) {
        ReturnReplacement rr = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Request not found with id: " + id));

        String oldStatus = rr.getStatus();
        String newStatus = status.toUpperCase();

        // Prevent duplicate processing
        if ("APPROVED".equalsIgnoreCase(oldStatus) && "APPROVED".equalsIgnoreCase(newStatus)) {
            return rr;
        }

        rr.setStatus(newStatus);
        rr.setProcessedDate(LocalDateTime.now());

        // Only handle APPROVED cases
        if (!"APPROVED".equalsIgnoreCase(newStatus)) {
            return repo.save(rr);
        }

        Order order = orderService.getOrderById(rr.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        // Apply item-level updates
        updateOrderItemAndTotal(order, rr);

        // Extra logic for REPLACEMENT
        if ("REPLACEMENT".equalsIgnoreCase(rr.getType())) {
            decreaseBookStock(rr.getBookId(), rr.getQuantity());
            rr.setDeliveryDate(LocalDateTime.now().plusDays(3));
        }

        orderService.saveOrder(order);
        return repo.save(rr);
    }

    /**
     * Updates order item quantity, subtotal, and recalculates total
     */
    private void updateOrderItemAndTotal(Order order, ReturnReplacement rr) {
        order.getItems().stream()
                .filter(i -> i.getBookId().equals(rr.getBookId()))
                .findFirst()
                .ifPresent(orderItem -> {
                    int updatedQty = Math.max(orderItem.getQuantity() - rr.getQuantity(), 0);
                    orderItem.setQuantity(updatedQty);
                    orderItem.setSubtotal(orderItem.getUnitPrice() * updatedQty);
                });

        // Recalculate total safely
        float newTotal = (float) order.getItems().stream()
                .mapToDouble(OrderItem::getSubtotal)
                .sum();
        order.setTotal(newTotal);
    }

    /**
     * Decrease book stock safely for replacement approval
     */
    private void decreaseBookStock(Long bookId, int qty) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
        book.setQuantity(Math.max(book.getQuantity() - qty, 0));
        bookRepository.save(book);
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
}
