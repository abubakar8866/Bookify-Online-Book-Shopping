package abubakar.bookapp.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import abubakar.bookapp.models.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByResetToken(String resetToken);
}
