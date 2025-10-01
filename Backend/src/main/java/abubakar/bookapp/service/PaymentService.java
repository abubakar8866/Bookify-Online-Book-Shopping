package abubakar.bookapp.service;

import java.util.Map;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;

import abubakar.bookapp.models.Order;
import abubakar.bookapp.models.RazorpayInfo;
import abubakar.bookapp.repository.RazorpayInfoRepository;

@Service
public class PaymentService {

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpaySecret;

    @Autowired
    private OrderService orderService;

    @Autowired
    private RazorpayInfoRepository razorpayInfoRepository;

    public String createRazorpayOrder(float amount) throws RazorpayException {
        RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpaySecret);

        JSONObject options = new JSONObject();
        options.put("amount", (int) (amount * 100)); // amount in paise
        options.put("currency", "INR");
        options.put("receipt", "txn_" + System.currentTimeMillis());

        com.razorpay.Order order = client.orders.create(options);
        return order.toString();
    }

    public boolean verifyPayment(String orderId, String paymentId, String signature) {
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", orderId);
            attributes.put("razorpay_payment_id", paymentId);
            attributes.put("razorpay_signature", signature);

            // If verification fails, it throws RazorpayException
            Utils.verifyPaymentSignature(attributes, razorpaySecret);
            return true; // success
        } catch (RazorpayException e) {
            return false; // invalid signature
        }
    }

    // Razorpay Order Handling
    public Order placeRazorpayOrder(Order order, Map<String, String> paymentData) {
        String razorpayOrderId = paymentData.get("razorpay_order_id");
        String razorpayPaymentId = paymentData.get("razorpay_payment_id");
        String razorpaySignature = paymentData.get("razorpay_signature");

        // 1. Verify payment first
        if (!verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
            throw new RuntimeException("Razorpay Payment Verification Failed!");
        }

        // 2. Place order using existing service
        Order savedOrder = orderService.placeOrder(order);

        // 3. Save Razorpay transaction info
        RazorpayInfo info = new RazorpayInfo();
        info.setOrder(savedOrder);
        info.setRazorpayOrderId(razorpayOrderId);
        info.setRazorpayPaymentId(razorpayPaymentId);
        info.setRazorpaySignature(razorpaySignature);
        razorpayInfoRepository.save(info);

        return savedOrder;
    }

    //fetching RazerPayInfo from DB according to OrderID
    public RazorpayInfo getRazorpayInfoByOrderId(Long orderId) {
        return razorpayInfoRepository.findByOrderId(orderId);
    }

}
