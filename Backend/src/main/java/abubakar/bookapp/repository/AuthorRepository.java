package abubakar.bookapp.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import abubakar.bookapp.models.Author;

public interface AuthorRepository extends JpaRepository<Author, Long> {

    // Case-insensitive search by partial match
    Page<Author> findByNameContainingIgnoreCase(String name, Pageable pageable);

}
