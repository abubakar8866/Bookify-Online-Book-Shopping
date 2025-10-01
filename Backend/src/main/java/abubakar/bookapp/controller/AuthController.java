package abubakar.bookapp.controller;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;

import abubakar.bookapp.models.User;
import abubakar.bookapp.payload.LoginRequest;
import abubakar.bookapp.payload.RegisterRequest;
import abubakar.bookapp.payload.USerIdResponse;
import abubakar.bookapp.repository.AuthorRepository;
import abubakar.bookapp.repository.BookRepository;
import abubakar.bookapp.repository.UserRepository;
import abubakar.bookapp.security.JwtUtils;
import abubakar.bookapp.service.UserService;
import jakarta.validation.Valid;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserRepository repo;
    private final BCryptPasswordEncoder encoder;
    private final JwtUtils jwtUtils;
    private final UserService userService;
    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;

    public AuthController(AuthenticationManager authManager, UserRepository repo,
            BCryptPasswordEncoder encoder, JwtUtils jwtUtils, UserService userService, BookRepository bookRepository,
            AuthorRepository authorRepository) {
        this.authManager = authManager;
        this.repo = repo;
        this.encoder = encoder;
        this.jwtUtils = jwtUtils;
        this.userService = userService;
        this.bookRepository = bookRepository;
        this.authorRepository = authorRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req, BindingResult result) {
        if (result.hasErrors()) {
            return ResponseEntity.badRequest()
                    .body(result.getAllErrors().stream()
                            .map(err -> err.getDefaultMessage())
                            .toList());
        }

        if (repo.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already in use");
        }

        User u = new User();
        u.setName(req.getName());
        u.setEmail(req.getEmail());
        u.setPassword(encoder.encode(req.getPassword()));
        u.setRole("ROLE_USER");
        repo.save(u);

        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req, BindingResult result) {
        if (result.hasErrors()) {
            return ResponseEntity.badRequest()
                    .body(result.getAllErrors().stream()
                            .map(err -> err.getDefaultMessage())
                            .toList());
        }

        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));

            User user = repo.findByEmail(req.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String roleWithoutPrefix = user.getRole().startsWith("ROLE_")
                    ? user.getRole().substring(5)
                    : user.getRole();

            String token = jwtUtils.generateJwtToken(user.getEmail(), roleWithoutPrefix);

            return ResponseEntity.ok(java.util.Map.of(
                    "token", token,
                    "role", user.getRole()));

        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
    }

    @PostMapping("/register-admin")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody RegisterRequest req,
            BindingResult result) {

        // Return validation errors if any
        if (result.hasErrors()) {
            return ResponseEntity.badRequest()
                    .body(result.getAllErrors()
                            .stream()
                            .map(err -> err.getDefaultMessage())
                            .toList());
        }

        // Check if any admin already exists
        boolean adminExists = repo.findAll().stream()
                .anyMatch(user -> "ROLE_ADMIN".equals(user.getRole()));
        if (adminExists) {
            return ResponseEntity.status(403).body("Admin already exists");
        }

        // Check if email already in use
        if (repo.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already in use");
        }

        // Create the first admin
        User u = new User();
        u.setName(req.getName());
        u.setEmail(req.getEmail());
        u.setPassword(encoder.encode(req.getPassword()));
        u.setRole("ROLE_ADMIN");
        repo.save(u);

        return ResponseEntity.ok("Admin registered successfully");
    }

    @PostMapping("/forgot-password")
    public String forgotPassword(@RequestParam String email) {
        return userService.generateResetToken(email);
    }

    @PostMapping("/reset-password")
    public String resetPassword(@RequestParam String token, @RequestParam String newPassword) {
        return userService.resetPassword(token, newPassword);
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<?> getUserIdByEmail(@PathVariable String email) {
        Optional<User> optionalUser = userService.findByEmail(email);
        User user = optionalUser.orElse(null);
        if (user != null) {
            return ResponseEntity.ok().body(new USerIdResponse(user.getId()));
        } else {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<?> getProfile(@PathVariable Long id) {
        return userService.getProfile(id)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(user))
                .orElseGet(() -> ResponseEntity.status(404).body("User not found"));
    }

    // Fetch only book names
    @GetMapping("/books")
    public ResponseEntity<?> getAllBooks() {
        return ResponseEntity.ok(
                bookRepository.findAll()
                        .stream()
                        .map(book -> book.getName())
                        .sorted(String::compareToIgnoreCase)
                        .toList());
    }

    // Fetch only author names
    @GetMapping("/authors")
    public ResponseEntity<?> getAllAuthors() {
        return ResponseEntity.ok(
                authorRepository.findAll()
                        .stream()
                        .map(author -> author.getName())
                        .sorted(String::compareToIgnoreCase)
                        .toList());
    }

    @PutMapping(value = "/profile/{id}", consumes = { "multipart/form-data" })
    public ResponseEntity<?> editProfile(
            @PathVariable Long id,
            @RequestPart("value") String value,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        try {
            // Parse JSON string into User object
            ObjectMapper mapper = new ObjectMapper();
            User updatedUser = mapper.readValue(value, User.class);

            // Call service to handle update (returns updated User)
            User result = userService.updateProfile(id, updatedUser, file);

            return ResponseEntity.ok(result); // Return updated user JSON

        } catch (RuntimeException e) {
            // Custom business exceptions (like "User not found")
            return ResponseEntity.status(404).body(e.getMessage());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to update profile");
        }
    }

}
