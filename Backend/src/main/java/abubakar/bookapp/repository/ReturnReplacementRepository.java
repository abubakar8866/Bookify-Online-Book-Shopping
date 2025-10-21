package abubakar.bookapp.repository;

import abubakar.bookapp.models.ReturnReplacement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReturnReplacementRepository extends JpaRepository<ReturnReplacement, Long> {

    List<ReturnReplacement> findByUserId(Long userId);

    List<ReturnReplacement> findByStatus(String status);
    
    // ✅ Prevent duplicate requests
    boolean existsByOrderIdAndBookIdAndStatusIn(Long orderId, Long bookId, List<String> statuses);
}
