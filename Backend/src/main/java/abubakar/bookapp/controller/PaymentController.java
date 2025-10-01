package abubakar.bookapp.controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;

import abubakar.bookapp.models.Order;
import abubakar.bookapp.models.RazorpayInfo;
import abubakar.bookapp.service.PaymentService;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${razorpay.key.id}")
    private String razorpayKey;

    @GetMapping("/key")
    public ResponseEntity<Map<String, String>> getRazorpayKey() {
        return ResponseEntity.ok(Map.of("key", razorpayKey));
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> data) {
        try {
            float amount = Float.parseFloat(data.get("amount").toString());
            String order = paymentService.createRazorpayOrder(amount);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> data) {
        boolean isValid = paymentService.verifyPayment(
                data.get("razorpay_order_id"),
                data.get("razorpay_payment_id"),
                data.get("razorpay_signature"));
        return ResponseEntity.ok(Map.of("success", isValid));
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/place-order")
    public ResponseEntity<?> placeRazorpayOrder(@RequestBody Map<String, Object> request) {
        try {
            // Extract order and paymentData from request
            Map<String, Object> orderMap = (Map<String, Object>) request.get("order");
            Map<String, String> paymentData = (Map<String, String>) request.get("paymentData");

            // Convert Map to Order object
            Order order = mapper.convertValue(orderMap, Order.class);

            // Place order through PaymentService (verifies Razorpay + saves order +
            // RazorpayInfo)
            Order savedOrder = paymentService.placeRazorpayOrder(order, paymentData);

            return ResponseEntity.ok(savedOrder);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/info/{orderId}")
    public ResponseEntity<?> getRazorpayInfo(@PathVariable Long orderId) {
        try {
            RazorpayInfo info = paymentService.getRazorpayInfoByOrderId(orderId);
            if (info == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Payment info not found for this order"));
            }
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

}
