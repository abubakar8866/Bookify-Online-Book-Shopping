package abubakar.bookapp.service;

import org.springframework.stereotype.Service;

import abubakar.bookapp.models.Book;
import abubakar.bookapp.models.Order;
import abubakar.bookapp.models.OrderItem;
import abubakar.bookapp.models.Review;
import abubakar.bookapp.payload.OrderRangeStatsDTO;
import abubakar.bookapp.payload.OrderStatsDTO;
import abubakar.bookapp.payload.OrderUpdateDTO;
import abubakar.bookapp.repository.BookRepository;
import abubakar.bookapp.repository.CartRepository;
import abubakar.bookapp.repository.OrderRepository;

import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CartRepository cartRepository;

    public Order placeOrder(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new RuntimeException("Order must contain at least one item.");
        }

        float total = 0f;
        for (OrderItem item : order.getItems()) {
            // 🔹 Fetch book to validate stock
            Book book = bookRepository.findById(item.getBookId())
                    .orElseThrow(() -> new RuntimeException("Book not found."));

            int newQuantity = book.getQuantity() - item.getQuantity();
            if (newQuantity < 0) {
                throw new RuntimeException("Insufficient stock for book: " + book.getName());
            }
            book.setQuantity(newQuantity);
            bookRepository.save(book);

            // 🔹 Set snapshot values
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

        return orderRepository.save(order);
    }

    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    // Fetch all orders (Admin only)
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    // Update only order status (Admin only)
    public Order updateOrderStatus(Long orderId, String orderStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        order.setOrderStatus(orderStatus);
        return orderRepository.save(order);
    }

    public Order editOrderById(Long orderId, OrderUpdateDTO dto) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        if (dto.getUserName() != null)
            order.setUserName(dto.getUserName());
        if (dto.getAddress() != null)
            order.setAddress(dto.getAddress());
        if (dto.getPhoneNumber() != null)
            order.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getDeliveryDate() != null)
            order.setDeliveryDate(dto.getDeliveryDate());

        return orderRepository.save(order);
    }

    public void removeOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found."));

        // Restore stock for each item in the order
        for (OrderItem item : order.getItems()) {
            if (item.getBookId() != null) {
                bookRepository.findById(item.getBookId()).ifPresent(book -> {
                    int updatedQuantity = book.getQuantity() + item.getQuantity();
                    book.setQuantity(updatedQuantity);
                    bookRepository.save(book);
                });
            }
        }

        orderRepository.deleteById(orderId);
    }

    public void removeOrderItem(Long orderId, Long bookId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found."));

        // Find the item inside this order
        OrderItem itemToRemove = order.getItems().stream()
                .filter(item -> item.getBookId().equals(bookId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Order item not found for bookId: " + bookId));

        // Restore stock
        if (itemToRemove.getBookId() != null) {
            bookRepository.findById(itemToRemove.getBookId()).ifPresent(book -> {
                int updatedQuantity = book.getQuantity() + itemToRemove.getQuantity();
                book.setQuantity(updatedQuantity);
                bookRepository.save(book);
            });
        }

        // Remove the item from the order
        order.getItems().remove(itemToRemove);

        // If order is now empty → delete order
        if (order.getItems().isEmpty()) {
            orderRepository.delete(order);
        } else {
            // 🔹 Recalculate total
            float newTotal = 0f;
            for (OrderItem item : order.getItems()) {
                newTotal += item.getSubtotal(); // use snapshot subtotal
            }
            order.setTotal(newTotal);

            // 🔹 Update updatedAt timestamp
            order.setUpdatedAt(LocalDateTime.now());

            orderRepository.save(order); // update order with new total
        }
    }

    // Add review and rating for an order item
    public OrderItem addReviewAndRating(Long orderId, Long bookId, String review, Float rating) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found."));

        OrderItem item = order.getItems().stream()
                .filter(i -> i.getBookId().equals(bookId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Order item not found for bookId: " + bookId));

        // Save review & rating snapshot inside order item
        item.setReview(review);
        item.setRating(rating);

        // Also add combined Review to Book
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found."));

        if ((review != null && !review.isEmpty()) || rating != null) {
            book.addReview(new Review(review, rating));
        }
        bookRepository.save(book);

        return orderRepository.save(order).getItems().stream()
                .filter(i -> i.getBookId().equals(bookId))
                .findFirst()
                .orElse(item);
    }

    // Dashboard stats (today + totals + recent)
    public OrderStatsDTO getOrderStats() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();

        long todaysOrderCount = orderRepository.countByCreatedAtAfter(startOfToday);
        long totalOrdersCount = orderRepository.count();

        // Convert to BigDecimal and handle null
        BigDecimal todaysOrderTotal = Optional.ofNullable(orderRepository.sumTodaysOrders(startOfToday))
                .map(BigDecimal::valueOf)
                .orElse(BigDecimal.ZERO);

        BigDecimal totalOrderAmount = Optional.ofNullable(orderRepository.sumTotalOrders())
                .map(BigDecimal::valueOf)
                .orElse(BigDecimal.ZERO);

        List<Order> recentOrders = orderRepository.findTop5ByOrderByCreatedAtDesc();

        return new OrderStatsDTO(
                todaysOrderCount,
                totalOrdersCount,
                todaysOrderTotal,
                totalOrderAmount,
                recentOrders);
    }

    // 🔹 Range stats
    public OrderRangeStatsDTO getOrderStatsByRange(LocalDateTime startDate, LocalDateTime endDate) {
        long orderCount = orderRepository.countOrdersInRange(startDate, endDate);

        BigDecimal orderTotal = Optional.ofNullable(orderRepository.sumOrdersInRange(startDate, endDate))
                .map(BigDecimal::valueOf)
                .orElse(BigDecimal.ZERO);

        return new OrderRangeStatsDTO(orderCount, orderTotal);
    }

    public Optional<Order> getOrderById(Long orderId) {
        return orderRepository.findById(orderId);
    }
}
