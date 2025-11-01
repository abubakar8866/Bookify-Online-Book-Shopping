package abubakar.bookapp.controller;

import org.springframework.web.bind.annotation.RestController;

import abubakar.bookapp.models.Wishlist;
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

    // Add book to wishlist
    @PostMapping("/{userId}/{bookId}")
    public ResponseEntity<Wishlist> addToWishlist(
            @PathVariable Long userId,
            @PathVariable Long bookId,
            Authentication authentication) {

        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Wishlist savedWishlist = wishlistService.addToWishlist(userId, bookId);
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
