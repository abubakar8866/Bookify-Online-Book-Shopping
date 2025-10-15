package abubakar.bookapp.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import abubakar.bookapp.models.Book;

public interface BookRepository extends JpaRepository<Book, Long> {

    @Query("SELECT COUNT(b) FROM Book b WHERE b.author.id = :authorId")
    Long countByAuthorId(Long authorId);

    // Case-insensitive search by partial match
    Page<Book> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
}
