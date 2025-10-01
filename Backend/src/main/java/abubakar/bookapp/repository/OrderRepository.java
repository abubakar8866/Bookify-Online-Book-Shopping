package abubakar.bookapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import abubakar.bookapp.models.Order;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // List orders by user ID
    public List<Order> findByUserId(Long userId);

    long countByCreatedAtAfter(LocalDateTime dateTime);

    @Query("SELECT COALESCE(SUM(o.total),0) FROM Order o WHERE o.createdAt >= :dateTime")
    float sumTodaysOrders(LocalDateTime dateTime);

    @Query("SELECT COALESCE(SUM(o.total),0) FROM Order o")
    float sumTotalOrders();

    List<Order> findTop5ByOrderByCreatedAtDesc();

    // For date range filtering
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate")
    long countOrdersInRange(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT COALESCE(SUM(o.total),0) FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate")
    float sumOrdersInRange(LocalDateTime startDate, LocalDateTime endDate);

}
