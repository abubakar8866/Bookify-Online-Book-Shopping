package abubakar.bookapp.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import abubakar.bookapp.models.Order;
import abubakar.bookapp.payload.OrderUpdateDTO;
import abubakar.bookapp.payload.ReviewRequestDTO;
import abubakar.bookapp.service.OrderService;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequestMapping("/api/order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    // Place a new order
    @PostMapping("/place")
    public ResponseEntity<Order> placeOrder(@RequestBody Order order) {
        Order savedOrder = orderService.placeOrder(order);
        return ResponseEntity.ok(savedOrder);
    }

    // Get orders by user ID
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getOrdersByUserId(@PathVariable Long userId) {
        List<Order> orders = orderService.getOrdersByUserId(userId);
        return ResponseEntity.ok(orders);
    }

    // Edit an existing order (by orderId now)
    @PutMapping("/edit/{orderId}")
    public ResponseEntity<Order> editOrderById(
            @PathVariable Long orderId,
            @RequestBody OrderUpdateDTO orderUpdateDTO) {
        Order updatedOrder = orderService.editOrderById(orderId, orderUpdateDTO);
        return ResponseEntity.ok(updatedOrder);
    }

    // Remove an order by order ID
    @DeleteMapping("/{orderId}")
    public ResponseEntity<Map<String, String>> removeOrder(@PathVariable Long orderId) {
        String message = orderService.removeOrder(orderId);
        return ResponseEntity.ok(Map.of("message", message));
    }

    // Remove a single product from an order
    @DeleteMapping("/{orderId}/book/{bookId}")
    public ResponseEntity<Map<String, String>> removeOrderItem(
            @PathVariable Long orderId,
            @PathVariable Long bookId) {

        String message = orderService.removeOrderItem(orderId, bookId);
        return ResponseEntity.ok(Map.of("message", message));
    }

    // Add review and rating for a specific order item
    @PostMapping("/{orderId}/book/{bookId}/review")
    public ResponseEntity<?> addReviewAndRating(
            @PathVariable Long orderId,
            @PathVariable Long bookId,
            @RequestBody ReviewRequestDTO dto) {
        return ResponseEntity.ok(
                orderService.addReviewAndRating(orderId, bookId, dto.getReview(), dto.getRating()));
    }

    // Print order (only for delivered orders)
    @GetMapping("/{orderId}/print/{orderStatus}")
    public ResponseEntity<Order> printOrder(
            @PathVariable Long orderId,
            @PathVariable String orderStatus) {
        Order printedOrder = orderService.printOrder(orderId, orderStatus);
        return ResponseEntity.ok(printedOrder);
    }

}
