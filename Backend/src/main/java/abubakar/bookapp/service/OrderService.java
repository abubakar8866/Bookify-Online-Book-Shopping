package abubakar.bookapp.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
import org.springframework.http.HttpStatus;

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

    // Place a new order
    public Order placeOrder(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order must contain at least one item.");
        }

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

            // Snapshot details
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

    // Get all orders for a user
    public List<Order> getOrdersByUserId(Long userId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        if (orders.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No orders found for user ID: " + userId);
        }
        return orders;
    }

    // Get all orders (Admin)
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    // Update only order status (Admin)
    public Order updateOrderStatus(Long orderId, String orderStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Order not found with ID: " + orderId));

        order.setOrderStatus(orderStatus);
        return orderRepository.save(order);
    }

    // Edit order by ID
    public Order editOrderById(Long orderId, OrderUpdateDTO dto) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Order not found with ID: " + orderId));

        if ("Delivered".equalsIgnoreCase(order.getOrderStatus()) ||
                "Cancelled".equalsIgnoreCase(order.getOrderStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot edit this order.");
        }

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

    // Remove an entire order
    public void removeOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Order not found with ID: " + orderId));

        if ("UPI".equalsIgnoreCase(order.getOrderMode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "You cannot cancel orders placed via UPI.");
        }

        if ("Delivered".equalsIgnoreCase(order.getOrderStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "You cannot delete a delivered order.");
        }

        // Restore stock
        for (OrderItem item : order.getItems()) {
            if (item.getBookId() != null) {
                bookRepository.findById(item.getBookId()).ifPresent(book -> {
                    book.setQuantity(book.getQuantity() + item.getQuantity());
                    bookRepository.save(book);
                });
            }
        }

        orderRepository.deleteById(orderId);
    }

    // Remove a single item from an order
    public void removeOrderItem(Long orderId, Long bookId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found."));

        if ("UPI".equalsIgnoreCase(order.getOrderMode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot modify UPI orders.");
        }

        if ("Delivered".equalsIgnoreCase(order.getOrderStatus()) ||
                "Cancelled".equalsIgnoreCase(order.getOrderStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot modify order because it's already " + order.getOrderStatus().toLowerCase());
        }

        OrderItem itemToRemove = order.getItems().stream()
                .filter(item -> item.getBookId().equals(bookId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Book not found in this order."));

        // Restore stock
        bookRepository.findById(bookId).ifPresent(book -> {
            book.setQuantity(book.getQuantity() + itemToRemove.getQuantity());
            bookRepository.save(book);
        });

        order.getItems().remove(itemToRemove);

        if (order.getItems().isEmpty()) {
            orderRepository.delete(order);
        } else {
            order.setTotal((float) order.getItems().stream()
                    .mapToDouble(OrderItem::getSubtotal)
                    .sum());
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);
        }
    }

    // Add review & rating
    public OrderItem addReviewAndRating(Long orderId, Long bookId, String review, Float rating) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found."));

        if (!"Delivered".equalsIgnoreCase(order.getOrderStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "You can only review delivered products.");
        }

        OrderItem item = order.getItems().stream()
                .filter(i -> i.getBookId().equals(bookId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Book not found in this order."));

        item.setReview(review);
        item.setRating(rating);

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found."));

        if ((review != null && !review.isEmpty()) || rating != null) {
            book.addReview(new Review(review, rating));
        }
        bookRepository.save(book);

        return orderRepository.save(order).getItems().stream()
                .filter(i -> i.getBookId().equals(bookId))
                .findFirst()
                .orElse(item);
    }

    // Print order (Delivered only)
    @Transactional
    public Order printOrder(Long orderId, String orderStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found."));

        if (!"Delivered".equalsIgnoreCase(orderStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Printing is allowed only for delivered orders.");
        }

        return order;
    }

    // Dashboard stats
    public OrderStatsDTO getOrderStats() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();

        long todaysOrderCount = orderRepository.countByCreatedAtAfter(startOfToday);
        long totalOrdersCount = orderRepository.count();

        BigDecimal todaysOrderTotal = Optional.ofNullable(orderRepository.sumTodaysOrders(startOfToday))
                .map(BigDecimal::valueOf)
                .orElse(BigDecimal.ZERO);

        BigDecimal totalOrderAmount = Optional.ofNullable(orderRepository.sumTotalOrders())
                .map(BigDecimal::valueOf)
                .orElse(BigDecimal.ZERO);

        List<Order> recentOrders = orderRepository.findTop5ByOrderByCreatedAtDesc();

        return new OrderStatsDTO(
                todaysOrderCount, totalOrdersCount, todaysOrderTotal, totalOrderAmount, recentOrders);
    }

    // Range stats (weekly/monthly)
    public OrderRangeStatsDTO getOrderStatsByRange(LocalDateTime startDate, LocalDateTime endDate) {
        long orderCount = orderRepository.countOrdersInRange(startDate, endDate);
        BigDecimal orderTotal = Optional.ofNullable(orderRepository.sumOrdersInRange(startDate, endDate))
                .map(BigDecimal::valueOf)
                .orElse(BigDecimal.ZERO);

        return new OrderRangeStatsDTO(orderCount, orderTotal);
    }

    // Utility methods
    public Optional<Order> getOrderById(Long orderId) {
        return orderRepository.findById(orderId);
    }

    @Transactional
    public Order saveOrder(Order order) {
        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

}
