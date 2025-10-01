package abubakar.bookapp.payload;

import java.math.BigDecimal;
import java.util.List;
import abubakar.bookapp.models.Order;

public class OrderStatsDTO {

    private long todayCount;
    private long totalCount;

    private BigDecimal todayTotal = BigDecimal.ZERO;
    private BigDecimal totalAmount = BigDecimal.ZERO;

    private List<Order> recentOrders;

    public OrderStatsDTO() {
        this.todayCount = 0L;
        this.totalCount = 0L;
        this.todayTotal = BigDecimal.ZERO;
        this.totalAmount = BigDecimal.ZERO;
    }

    public OrderStatsDTO(long todayCount, long totalCount, BigDecimal todayTotal,
                         BigDecimal totalAmount, List<Order> recentOrders) {
        this.todayCount = todayCount;
        this.totalCount = totalCount;
        this.todayTotal = (todayTotal != null) ? todayTotal : BigDecimal.ZERO;
        this.totalAmount = (totalAmount != null) ? totalAmount : BigDecimal.ZERO;
        this.recentOrders = recentOrders;
    }

    // ✅ Safe getters
    public BigDecimal getTodayTotal() {
        return todayTotal != null ? todayTotal : BigDecimal.ZERO;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount != null ? totalAmount : BigDecimal.ZERO;
    }

    // other getters/setters
    public long getTodayCount() { return todayCount; }
    public void setTodayCount(long todayCount) { this.todayCount = todayCount; }

    public long getTotalCount() { return totalCount; }
    public void setTotalCount(long totalCount) { this.totalCount = totalCount; }

    public void setTodayTotal(BigDecimal todayTotal) {
        this.todayTotal = todayTotal != null ? todayTotal : BigDecimal.ZERO;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount != null ? totalAmount : BigDecimal.ZERO;
    }

    public List<Order> getRecentOrders() { return recentOrders; }
    public void setRecentOrders(List<Order> recentOrders) { this.recentOrders = recentOrders; }
}
