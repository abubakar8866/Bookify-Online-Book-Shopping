package abubakar.bookapp.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import abubakar.bookapp.models.Book;
import abubakar.bookapp.models.User;
import abubakar.bookapp.models.Cart;
import abubakar.bookapp.repository.BookRepository;
import abubakar.bookapp.service.CartService;

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
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @Autowired
    private BookRepository bookRepo;

    //Add book to cart
    @PostMapping("/{userId}/{bookId}")
    public ResponseEntity<?> addToCart(@PathVariable Long userId, @PathVariable Long bookId,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated.");
        }

        Book book = bookRepo.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found."));

        Cart cart = new Cart();
        cart.setUser(new User(userId));
        cart.setBook(book);

        Cart savedCart = cartService.addToCart(cart);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCart);
    }

    //Get user cart
    @GetMapping("/{userId}")
    public ResponseEntity<List<Cart>> getCart(@PathVariable Long userId, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated.");
        }

        List<Cart> userCart = cartService.getUserCart(userId);
        return ResponseEntity.ok(userCart);
    }

    //Get user name by userId
    @GetMapping("/{userId}/name")
    public ResponseEntity<String> getUserName(@PathVariable Long userId) {
        String userName = cartService.getUserNameByUserId(userId);
        return ResponseEntity.ok(userName);
    }

    //Remove from cart
    @DeleteMapping("/{userId}/{cartId}")
    public ResponseEntity<String> removeFromCart(@PathVariable Long userId, @PathVariable Long cartId, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated.");
        }

        cartService.removeFromCart(cartId, userId);
        return ResponseEntity.ok("Removed from cart successfully.");
    }

}
