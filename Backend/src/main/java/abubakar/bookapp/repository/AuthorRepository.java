package abubakar.bookapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import abubakar.bookapp.models.Author;

public interface AuthorRepository extends JpaRepository<Author, Long> {}
