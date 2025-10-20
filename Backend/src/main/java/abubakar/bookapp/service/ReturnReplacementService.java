package abubakar.bookapp.service;

import abubakar.bookapp.models.Order;
import abubakar.bookapp.models.OrderItem;
import abubakar.bookapp.models.ReturnReplacement;
import abubakar.bookapp.repository.ReturnReplacementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ReturnReplacementService {

    @Autowired
    private ReturnReplacementRepository repo;

    @Autowired
    private OrderService orderService;

    // Create new request
    public ReturnReplacement createRequest(ReturnReplacement rr) {
        // Fetch original order details (assume you have OrderService)
        Order order = orderService.getOrderById(rr.getOrderId()).get();

        // Find the book in order items
        OrderItem item = order.getItems().stream()
                .filter(i -> i.getBookId().equals(rr.getBookId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Book not found in order"));

        // Copy quantity from order
        rr.setQuantity(item.getQuantity());

        // Set default status and requested date
        rr.setStatus("PENDING");
        rr.setRequestedDate(LocalDateTime.now());

        return repo.save(rr);
    }

    // Get all requests of a specific user
    public List<ReturnReplacement> getRequestsByUser(Long userId) {
        return repo.findByUserId(userId);
    }

    // Get request by ID
    public Optional<ReturnReplacement> getRequestById(Long id) {
        return repo.findById(id);
    }

    // Update status (used when admin acts or refund completes)
    public ReturnReplacement updateStatus(Long id, String status) {
        ReturnReplacement rr = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found with id: " + id));
        rr.setStatus(status);
        rr.setProcessedDate(LocalDateTime.now());
        return repo.save(rr);
    }

    // get all requests
    public List<ReturnReplacement> getAllRequests() {
        return repo.findAll();
    }

    // get details via status
    public List<ReturnReplacement> getRequestsByStatus(String status) {
        return repo.findByStatus(status);
    }

    public ReturnReplacement save(ReturnReplacement rr) {
        return repo.save(rr);
    }

}
