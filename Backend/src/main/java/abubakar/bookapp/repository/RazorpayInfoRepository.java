package abubakar.bookapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import abubakar.bookapp.models.RazorpayInfo;

public interface RazorpayInfoRepository extends JpaRepository<RazorpayInfo, Long> {
    RazorpayInfo findByOrderId(Long orderId);
}
