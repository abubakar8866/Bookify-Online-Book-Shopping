package abubakar.bookapp.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import abubakar.bookapp.models.Order;
import abubakar.bookapp.models.RazorpayInfo;
import abubakar.bookapp.payload.OrderRangeRequestDTO;
import abubakar.bookapp.payload.OrderRangeStatsDTO;
import abubakar.bookapp.payload.OrderStatsDTO;
import abubakar.bookapp.payload.OrderStatusUpdateDTO;
import abubakar.bookapp.service.OrderService;
import abubakar.bookapp.service.PaymentService;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class OrderAdminController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private PaymentService paymentService;

    // Fetch all orders (Admin only)
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    // Fetch all razerInfo details
    @GetMapping("/info/{orderId}")
    public ResponseEntity<?> getRazorpayInfo(@PathVariable Long orderId) {
        RazorpayInfo info = paymentService.getRazorpayInfoByOrderId(orderId);
        if (info == null) {
            // Let Spring handle 404 — simple and consistent
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Payment info not found for order ID: " + orderId);
        }
        return ResponseEntity.ok(info);
    }

    // Update only orderStatus (Admin only)
    @PutMapping("/{orderId}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody OrderStatusUpdateDTO dto) {
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, dto.getOrderStatus()));
    }

    // Dashboard stats (today, total, 5 recent)
    @GetMapping("/stats")
    public ResponseEntity<OrderStatsDTO> getOrderStats() {
        return ResponseEntity.ok(orderService.getOrderStats());
    }

    // Custom range stats (weekly, monthly, etc.)
    @PostMapping("/stats/range")
    public ResponseEntity<OrderRangeStatsDTO> getOrderStatsByRange(
            @RequestBody OrderRangeRequestDTO dto) {
        return ResponseEntity.ok(
                orderService.getOrderStatsByRange(dto.getStartDate(), dto.getEndDate()));
    }

    // Weekly stats
    @GetMapping("/stats/weekly")
    public ResponseEntity<OrderRangeStatsDTO> getWeeklyStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfWeek = today.minusDays(today.getDayOfWeek().getValue() - 1).atStartOfDay();
        LocalDateTime endOfWeek = today.with(java.time.DayOfWeek.SUNDAY).atTime(23, 59, 59);

        return ResponseEntity.ok(
                orderService.getOrderStatsByRange(startOfWeek, endOfWeek));
    }

    // Monthly stats
    @GetMapping("/stats/monthly")
    public ResponseEntity<OrderRangeStatsDTO> getMonthlyStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = today.withDayOfMonth(today.lengthOfMonth()).atTime(23, 59, 59);

        return ResponseEntity.ok(
                orderService.getOrderStatsByRange(startOfMonth, endOfMonth));
    }

}
