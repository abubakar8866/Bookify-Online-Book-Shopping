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

    // Fetch Razorpay Key for frontend
    @GetMapping("/key")
    public ResponseEntity<Map<String, String>> getRazorpayKey() {
        return ResponseEntity.ok(Map.of("key", razorpayKey));
    }

    // Create Razorpay order
    @PostMapping("/create-order")
    public ResponseEntity<String> createOrder(@RequestBody Map<String, Object> data) {
        float amount = Float.parseFloat(data.get("amount").toString());
        String order = paymentService.createRazorpayOrder(amount);
        return ResponseEntity.ok(order);
    }

    // Verify payment
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(@RequestBody Map<String, String> data) {
        boolean isValid = paymentService.verifyPayment(
                data.get("razorpay_order_id"),
                data.get("razorpay_payment_id"),
                data.get("razorpay_signature"));
        return ResponseEntity.ok(Map.of("success", isValid));
    }

    // Place order (includes payment verification + saving Razorpay info)
    @SuppressWarnings("unchecked")
    @PostMapping("/place-order")
    public ResponseEntity<Order> placeRazorpayOrder(@RequestBody Map<String, Object> request) {
        Map<String, Object> orderMap = (Map<String, Object>) request.get("order");
        Map<String, String> paymentData = (Map<String, String>) request.get("paymentData");

        Order order = mapper.convertValue(orderMap, Order.class);
        Order savedOrder = paymentService.placeRazorpayOrder(order, paymentData);
        return ResponseEntity.ok(savedOrder);
    }

    // Fetch payment info by order ID
    @GetMapping("/info/{orderId}")
    public ResponseEntity<RazorpayInfo> getRazorpayInfo(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.getRazorpayInfoByOrderId(orderId));
    }

}
