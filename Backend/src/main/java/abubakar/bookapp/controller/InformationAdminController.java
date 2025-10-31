package abubakar.bookapp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import abubakar.bookapp.models.Cart;
import abubakar.bookapp.models.User;
import abubakar.bookapp.models.Wishlist;
import abubakar.bookapp.repository.CartRepository;
import abubakar.bookapp.repository.UserRepository;
import abubakar.bookapp.repository.WishlistRepository;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequestMapping("/api/info")
@PreAuthorize("hasRole('ADMIN')")
public class InformationAdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private WishlistRepository wishlistRepository;

    // Fetch all users
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();

            if (users.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No users found in the system.");
            }

            return ResponseEntity.ok(users);

        } catch (ResponseStatusException ex) {
            throw ex; // handled by GlobalExceptionHandler
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch users.");
        }
    }

    // Fetch all cart items
    @GetMapping("/carts")
    public ResponseEntity<List<Cart>> getAllCarts() {
        try {
            List<Cart> carts = cartRepository.findAll();

            if (carts.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No cart items found.");
            }

            return ResponseEntity.ok(carts);

        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch cart data.");
        }
    }

    //Fetch all wishlist items
    @GetMapping("/wishlists")
    public ResponseEntity<List<Wishlist>> getAllWishlists() {
        try {
            List<Wishlist> wishlists = wishlistRepository.findAll();

            if (wishlists.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No wishlist items found.");
            }

            return ResponseEntity.ok(wishlists);

        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch wishlists.");
        }
    }

}
