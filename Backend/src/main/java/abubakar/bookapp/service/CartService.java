package abubakar.bookapp.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import abubakar.bookapp.models.Book;
import abubakar.bookapp.models.Cart;
import abubakar.bookapp.models.User;
import abubakar.bookapp.repository.CartRepository;
import abubakar.bookapp.repository.UserRepository;

@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private UserRepository userRepository;

    //Add to cart with exception safety
    public Cart addToCart(Cart cart) {
        if (cart == null || cart.getUser() == null || cart.getBook() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid cart details.");
        }

        Long userId = cart.getUser().getId();
        Long bookId = cart.getBook().getId();

        if (userId == null || bookId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID and Book ID must be provided.");
        }

        // Check if book already exists in user's cart
        boolean exists = cartRepository.existsByUserIdAndBookId(userId, bookId);
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Book already exists in cart.");
        }

        // Check if product has valid stock
        Integer qty = cart.getBook().getQuantity();
        if (qty == null || qty <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product is out of stock.");
        }

        try {
            return cartRepository.save(cart);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to add to cart.");
        }
    }

    //Get all items in user's cart
    public List<Cart> getUserCart(Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID cannot be null.");
        }

        List<Cart> carts = cartRepository.findByUserId(userId);
        if (carts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No items found in cart.");
        }

        return carts;
    }

    //Get user name safely
    public String getUserNameByUserId(Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID cannot be null.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        return user.getName();
    }

    //Remove specific item from user's cart
    public void removeFromCart(Long cartId, Long userId) {
        if (cartId == null || userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart ID and User ID are required.");
        }

        boolean exists = cartRepository.existsById(cartId);
        if (!exists) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found.");
        }

        try {
            cartRepository.deleteByIdAndUserId(cartId, userId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to remove item from cart.");
        }
    }

    //Delete all cart items for a specific book
    public void deleteAllByBook(Book book) {
        if (book == null || book.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book details are required.");
        }

        List<Cart> cartItems = cartRepository.findByBookId(book.getId());
        if (cartItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No cart entries found for this book.");
        }

        cartRepository.deleteAll(cartItems);
    }

    //Get carts by book ID
    public List<Cart> getCartsByBookId(Long bookId) {
        if (bookId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book ID cannot be null.");
        }

        List<Cart> carts = cartRepository.findByBookId(bookId);
        if (carts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No carts found for this book.");
        }

        return carts;
    }

}
