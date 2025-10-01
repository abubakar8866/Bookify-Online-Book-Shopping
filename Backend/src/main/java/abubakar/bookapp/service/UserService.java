package abubakar.bookapp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

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
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setTokenExpiry(LocalDateTime.now().plusHours(1)); // valid 1 hour
        userRepository.save(user);

        // Build dynamic frontend URL
        String resetUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                .scheme("http") 
                .host("localhost") 
                .port(3000)
                .path("/reset-password")
                .queryParam("token", token)
                .toUriString();

        // Send email
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Password Reset Request");
        message.setText("To reset your password, click the link: " + resetUrl);
        mailSender.send(message);

        return "Email sent successfully";
    }

    // Reset password using token
    public String resetPassword(String token, String newPassword) {
        Optional<User> optionalUser = userRepository.findByResetToken(token);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();

            // Check token expiry
            if (user.getTokenExpiry().isBefore(LocalDateTime.now())) {
                return "Token expired. Please request a new password reset.";
            }

            // Hash the new password
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setResetToken(null);
            user.setTokenExpiry(null);
            userRepository.save(user);
            return "Password reset successfully";
        } else {
            return "Invalid token";
        }
    }

    // Find user by email
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // Get profile by ID
    public Optional<User> getProfile(Long id) {
        return userRepository.findById(id);
    }

    // Update profile with optional image upload
    public User updateProfile(Long id, User updatedUser, MultipartFile file) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

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
        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isBlank())
            user.setPassword(passwordEncoder.encode(updatedUser.getPassword()));

        // Handle file upload via FileStorageService
        if (file != null && !file.isEmpty()) {
            try {
                // Delete old image if it exists
                if (user.getImageUrl() != null) {
                    fileStorageService.delete(user.getImageUrl());
                }

                // Save new image and set URL
                String fileUrl = fileStorageService.saveProfileImage(file, id);
                user.setImageUrl(fileUrl);

            } catch (Exception e) {
                throw new RuntimeException("Failed to store profile image", e);
            }
        }

        return userRepository.save(user);
    }

}
