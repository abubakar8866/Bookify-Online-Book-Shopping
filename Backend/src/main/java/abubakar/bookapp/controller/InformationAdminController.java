package abubakar.bookapp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    // ✅ Fetch all users 
    @GetMapping("/users") 
    public ResponseEntity<List<User>> getAllUsers() { 
        return ResponseEntity.ok(userRepository.findAll()); 
    } 
    // ✅ Fetch all cart items 
    @GetMapping("/carts") 
    public ResponseEntity<List<Cart>> getAllCarts() { 
        return ResponseEntity.ok(cartRepository.findAll()); 
    } 
    
    // ✅ Fetch all wishlist items 
    @GetMapping("/wishlists") 
    public ResponseEntity<List<Wishlist>> getAllWishlists() { 
        return ResponseEntity.ok(wishlistRepository.findAll()); 
    }

}
