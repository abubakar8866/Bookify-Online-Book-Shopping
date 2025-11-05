package abubakar.bookapp.service;

import java.math.BigDecimal;
import java.util.Map;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Refund;
import com.razorpay.Utils;

import abubakar.bookapp.models.Book;
import abubakar.bookapp.models.Order;
import abubakar.bookapp.models.OrderItem;
import abubakar.bookapp.models.RazorpayInfo;
import abubakar.bookapp.repository.BookRepository;
import abubakar.bookapp.repository.CartRepository;
import abubakar.bookapp.repository.OrderRepository;
import abubakar.bookapp.repository.RazorpayInfoRepository;

@Service
public class PaymentService {

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpaySecret;

    @Autowired
    private RazorpayInfoRepository razorpayInfoRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CartRepository cartRepository;

    public String createRazorpayOrder(float amount) {
        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpaySecret);

            JSONObject options = new JSONObject();
            options.put("amount", (int) (amount * 100)); // paise
            options.put("currency", "INR");
            options.put("receipt", "txn_" + System.currentTimeMillis());

            com.razorpay.Order order = client.orders.create(options);
            return order.toString();
        } catch (RazorpayException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to create Razorpay order: " + e.getMessage(), e);
        }
    }

    public boolean verifyPayment(String orderId, String paymentId, String signature) {
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", orderId);
            attributes.put("razorpay_payment_id", paymentId);
            attributes.put("razorpay_signature", signature);

            Utils.verifyPaymentSignature(attributes, razorpaySecret);
            return true;
        } catch (RazorpayException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Razorpay payment signature.", e);
        }
    }

    public Order placeRazorpayOrder(Order order, Map<String, String> paymentData) {
        String razorpayOrderId = paymentData.get("razorpay_order_id");
        String razorpayPaymentId = paymentData.get("razorpay_payment_id");
        String razorpaySignature = paymentData.get("razorpay_signature");

        // 1. Verify payment
        verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);

        // 2. Process items & stock like in OrderService.placeOrder()
        float total = 0f;

        for (OrderItem item : order.getItems()) {
            Book book = bookRepository.findById(item.getBookId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Book not found with ID: " + item.getBookId()));

            int newQuantity = book.getQuantity() - item.getQuantity();
            if (newQuantity < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Insufficient stock for book: " + book.getName());
            }

            book.setQuantity(newQuantity);
            bookRepository.save(book);

            item.setBookName(book.getName());
            item.setUnitPrice(book.getPrice().floatValue());
            item.setSubtotal(book.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())).floatValue());
            item.setAuthorName(book.getAuthor() != null ? book.getAuthor().getName() : "Unknown");
            item.setOrder(order);

            total += item.getSubtotal();
        }

        order.setTotal(total);

        if (order.getUser() != null) {
            cartRepository.deleteByUserId(order.getUser().getId());
        }

        // 3. Save order directly
        Order savedOrder = orderRepository.save(order);

        // 4. Save payment info
        RazorpayInfo info = new RazorpayInfo();
        info.setOrder(savedOrder);
        info.setRazorpayOrderId(razorpayOrderId);
        info.setRazorpayPaymentId(razorpayPaymentId);
        info.setRazorpaySignature(razorpaySignature);

        razorpayInfoRepository.save(info);
        return savedOrder;
    }

    public RazorpayInfo getRazorpayInfoByOrderId(Long orderId) {
        RazorpayInfo info = razorpayInfoRepository.findByOrderId(orderId);
        if (info == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Payment info not found for order ID: " + orderId);
        }
        return info;
    }

    public Refund refundPayment(String paymentId, double amountInINR) {
        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpaySecret);

            JSONObject refundRequest = new JSONObject();
            refundRequest.put("payment_id", paymentId);
            refundRequest.put("amount", (int) (amountInINR * 100)); // convert INR → paise
            refundRequest.put("speed", "normal");

            return client.payments.refund(refundRequest);
        } catch (RazorpayException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Razorpay refund failed: " + e.getMessage(), e);
        }
    }

}
