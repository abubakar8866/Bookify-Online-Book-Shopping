package abubakar.bookapp.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import abubakar.bookapp.models.Book;
import abubakar.bookapp.models.User;
import abubakar.bookapp.repository.BookRepository;
import abubakar.bookapp.repository.UserRepository;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequestMapping("/api/user/books")
public class UserBookController {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    public UserBookController(BookRepository bookRepository, UserRepository userRepository) {
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }

    // Get paginated books for logged-in user
    @SuppressWarnings("unused")
    @GetMapping
    public ResponseEntity<?> getAllBooks(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "3") int size) {

        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        // Ensure user exists in DB
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Pageable object
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());

        // Fetch paginated books
        Page<Book> booksPage = bookRepository.findAll(pageable);

        return ResponseEntity.ok(booksPage);
    }
}
