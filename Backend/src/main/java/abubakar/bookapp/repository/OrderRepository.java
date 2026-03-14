package abubakar.bookapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import abubakar.bookapp.models.Order;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Orders by user
    List<Order> findByUserId(Long userId);

    // Today's order count (excluding cancelled)
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :dateTime AND o.orderStatus <> 'Cancelled'")
    long countTodaysOrders(LocalDateTime dateTime);

    // Today's sales amount
    @Query("SELECT COALESCE(SUM(o.total),0) FROM Order o WHERE o.createdAt >= :dateTime AND o.orderStatus <> 'Cancelled'")
    float sumTodaysOrders(LocalDateTime dateTime);

    // Total orders (excluding cancelled)
    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderStatus <> 'Cancelled'")
    long countTotalOrders();

    // Total sales (excluding cancelled)
    @Query("SELECT COALESCE(SUM(o.total),0) FROM Order o WHERE o.orderStatus <> 'Cancelled'")
    float sumTotalOrders();

    // Latest 5 orders
    List<Order> findTop5ByOrderByCreatedAtDesc();

    // Orders in date range
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate AND o.orderStatus <> 'Cancelled'")
    long countOrdersInRange(LocalDateTime startDate, LocalDateTime endDate);

    // Sales in date range
    @Query("SELECT COALESCE(SUM(o.total),0) FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate AND o.orderStatus <> 'Cancelled'")
    float sumOrdersInRange(LocalDateTime startDate, LocalDateTime endDate);

}