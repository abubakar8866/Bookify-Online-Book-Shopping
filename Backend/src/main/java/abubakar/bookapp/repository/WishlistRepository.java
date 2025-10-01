package abubakar.bookapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import abubakar.bookapp.models.Wishlist;

import java.util.List;


public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findByUserId(Long userId);

    @Transactional
    void deleteByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndBookId(Long userId, Long bookId);

    List<Wishlist> findByBookId(Long book_id);
}
