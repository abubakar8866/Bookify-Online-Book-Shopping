package abubakar.bookapp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import abubakar.bookapp.exception.FileStorageException;
import abubakar.bookapp.exception.InvalidTokenException;
import abubakar.bookapp.exception.UserNotFoundException;
import abubakar.bookapp.models.User;
import abubakar.bookapp.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private FileStorageService fileStorageService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Generate reset token
    public String generateResetToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));

        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        try {
            String resetUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .scheme("http")
                    .host("localhost")
                    .port(3000)
                    .path("/reset-password")
                    .queryParam("token", token)
                    .toUriString();

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Password Reset Request");
            message.setText("Click the link to reset your password: " + resetUrl);
            mailSender.send(message);

            return "Password reset email sent successfully";

        } catch (Exception e) {
            throw new RuntimeException("Failed to send reset email", e);
        }
    }

    // Reset password
    public String resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid password reset token"));

        if (user.getTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Token expired. Please request a new password reset.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setTokenExpiry(null);
        userRepository.save(user);
        return "Password reset successfully";
    }

    // Find user by email
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // Get profile by ID
    public Optional<User> getProfile(Long id) {
        return userRepository.findById(id);
    }

    // Update profile
    public User updateProfile(Long id, User updatedUser, MultipartFile file) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));

        try {
            if (updatedUser.getName() != null)
                user.setName(updatedUser.getName());
            if (updatedUser.getAddress() != null)
                user.setAddress(updatedUser.getAddress());
            if (updatedUser.getGender() != null)
                user.setGender(updatedUser.getGender());
            if (updatedUser.getFavouriteBook() != null)
                user.setFavouriteBook(updatedUser.getFavouriteBook());
            if (updatedUser.getFavouriteAuthor() != null)
                user.setFavouriteAuthor(updatedUser.getFavouriteAuthor());
            if (updatedUser.getPassword() != null && !updatedUser.getPassword().isBlank()) {
                user.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
            }

            // Handle file upload
            if (file != null && !file.isEmpty()) {
                if (user.getImageUrl() != null) {
                    fileStorageService.delete(user.getImageUrl());
                }
                String fileUrl = fileStorageService.saveProfileImage(file, id);
                user.setImageUrl(fileUrl);
            }

            return userRepository.save(user);

        } catch (FileStorageException e) {
            throw e; // already handled globally
        } catch (Exception e) {
            throw new RuntimeException("Failed to update profile", e);
        }
    }

}
