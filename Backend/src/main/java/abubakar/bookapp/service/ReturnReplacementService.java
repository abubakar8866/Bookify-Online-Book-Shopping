package abubakar.bookapp.service;

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
     * Update status — handled by admin actions
     */
    @Transactional
    public ReturnReplacement updateStatus(Long id, String status) {
        ReturnReplacement rr = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Request not found with id: " + id));

        String oldStatus = rr.getStatus();
        String newStatus = status.toUpperCase();

        rr.setStatus(newStatus);
        rr.setProcessedDate(LocalDateTime.now());

        // ✅ When RETURN + APPROVED
        if ("RETURN".equalsIgnoreCase(rr.getType())
                && "APPROVED".equalsIgnoreCase(newStatus)
                && !"APPROVED".equalsIgnoreCase(oldStatus)) {

            // 1️⃣ Increase book stock
            bookRepository.findById(rr.getBookId()).ifPresent(book -> {
                book.setQuantity(book.getQuantity() + rr.getQuantity());
                bookRepository.save(book);
            });

            // 2️⃣ Decrease OrderItem quantity
            Order order = orderService.getOrderById(rr.getOrderId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

            order.getItems().stream()
                    .filter(i -> i.getBookId().equals(rr.getBookId()))
                    .findFirst()
                    .ifPresent(orderItem -> {
                        int updatedQty = orderItem.getQuantity() - rr.getQuantity();
                        if (updatedQty < 0)
                            updatedQty = 0; // prevent negative qty
                        orderItem.setQuantity(updatedQty);
                    });

            // persist updated order items
            orderService.saveOrder(order);
        }

        return repo.save(rr);
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
