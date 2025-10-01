package abubakar.bookapp.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import abubakar.bookapp.models.Book;
import abubakar.bookapp.models.User;
import abubakar.bookapp.models.Wishlist;
import abubakar.bookapp.repository.BookRepository;
import abubakar.bookapp.service.WishlistService;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequestMapping("/api/wishlist")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @Autowired
    private BookRepository bookRepo;

    // Add book to wishlist
    @PostMapping("/{userId}/{bookId}")
    public ResponseEntity<?> addToWishlist(@PathVariable Long userId, @PathVariable Long bookId,
            Authentication authentication) {

        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Book book = bookRepo.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));

        Wishlist wishlist = new Wishlist();
        wishlist.setUser(new User(userId)); 
        wishlist.setBook(book);

        // Check if the book is already in the wishlist
        boolean exists = wishlistService.getUserWishlist(userId).stream()
                .anyMatch(w -> w.getBook().getId().equals(bookId));

        if (exists) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Book already exists in wishlist");
        }

        Wishlist savedWishlist = wishlistService.addToWishlist(wishlist);

        return ResponseEntity.ok(savedWishlist);
    }

    // Get user wishlist
    @GetMapping("/{userId}")
    public ResponseEntity<List<Wishlist>> getWishlist(@PathVariable Long userId, Authentication authentication) {

        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(wishlistService.getUserWishlist(userId));
    }

    // Remove from wishlist
    @DeleteMapping("/{userId}/{wishlistId}")
    public ResponseEntity<String> removeFromWishlist(@PathVariable Long userId, @PathVariable Long wishlistId,
            Authentication authentication) {

        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        wishlistService.removeFromWishlist(wishlistId, userId);
        return ResponseEntity.ok("Removed from wishlist");
    }

}
