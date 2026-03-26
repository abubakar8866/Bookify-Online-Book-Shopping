package abubakar.bookapp.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.razorpay.Refund;

import abubakar.bookapp.models.Order;
import abubakar.bookapp.models.OrderItem;
import abubakar.bookapp.models.RazorpayInfo;
import abubakar.bookapp.models.ReturnReplacement;
import abubakar.bookapp.service.OrderService;
import abubakar.bookapp.service.PaymentService;
import abubakar.bookapp.service.ReturnReplacementService;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequestMapping("/api/admin/returns")
public class ReturnReplacementAdminController {

    @Autowired
    private ReturnReplacementService service;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private OrderService orderService;

    // Get all return/replacement requests
    @GetMapping("/all")
    public ResponseEntity<List<ReturnReplacement>> getAllRequests() {
        return ResponseEntity.ok(service.getAllRequests());
    }

    // Get requests by status (optional filter)
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ReturnReplacement>> getRequestsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(service.getRequestsByStatus(status.toUpperCase()));
    }

    // Approve/Reject/Refund/Replace by ID
    @PutMapping("/update-status/{id}")
    public ResponseEntity<ReturnReplacement> updateStatus(@PathVariable Long id, @RequestParam String status) {
        ReturnReplacement updated = service.updateStatus(id, status.toUpperCase());
        return ResponseEntity.ok(updated);
    }

    // Refund Money Api by RazerPay
    @PutMapping("/refund/{returnId}")
    public ResponseEntity<?> refundReturnRequest(@PathVariable Long returnId) {

        ReturnReplacement rr = service.getRequestById(returnId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Return request not found"));

        // Only approved can be refunded
        if (!"APPROVED".equalsIgnoreCase(rr.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Return must be approved before refunding.");
        }

        // Prevent duplicate refund
        if ("REFUNDED".equalsIgnoreCase(rr.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Request already refunded.");
        }

        RazorpayInfo info = paymentService.getRazorpayInfoByOrderId(rr.getOrderId());
        if (info == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Razorpay transaction info not found.");
        }

        Order order = orderService.getOrderById(rr.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        OrderItem item = order.getItems().stream()
                .filter(i -> i.getBookId().equals(rr.getBookId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book not found in order"));

        int qty = rr.getQuantity();

        // SAFETY CHECK (VERY IMPORTANT)
        int remaining = item.getQuantity()
                - item.getReturnedQuantity()
                - item.getReplacedQuantity();

        if (qty > remaining) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Refund exceeds allowed returnable quantity. Remaining: " + remaining);
        }

        // Calculate refund
        double refundAmount = qty * item.getUnitPrice();

        // Call Razorpay
        Refund refund = paymentService.refundPayment(info.getRazorpayPaymentId(), refundAmount);

        // UPDATE ORDER ITEM RETURN COUNT
        item.setReturnedQuantity(item.getReturnedQuantity() + qty);

        // Recalculate subtotal (IMPORTANT)
        int effectiveQty = item.getQuantity()
                - item.getReturnedQuantity()
                - item.getReplacedQuantity();

        if (effectiveQty < 0)
            effectiveQty = 0;

        item.setSubtotal(item.getUnitPrice() * effectiveQty);

        // Recalculate order totals
        float subtotal = (float) order.getItems().stream()
                .mapToDouble(OrderItem::getSubtotal)
                .sum();

        float gst = subtotal * 0.05f;
        float total = subtotal + gst;

        order.setSubtotal(subtotal);
        order.setGst(gst);
        order.setTotal(total);

        // Save updated order
        orderService.saveOrder(order);

        // Update return request
        rr.setStatus("REFUNDED");
        rr.setRefundedAmount(refundAmount);
        rr.setProcessedDate(LocalDateTime.now());
        rr.setPaymentId(info.getRazorpayPaymentId());

        service.save(rr);

        return ResponseEntity.ok(refund.toString());
    }

}
