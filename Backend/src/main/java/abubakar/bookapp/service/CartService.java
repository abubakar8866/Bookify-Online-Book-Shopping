package abubakar.bookapp.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    public Cart addToCart(Cart cart) {
        Long userId = cart.getUser().getId();
        Long bookId = cart.getBook().getId();

        boolean exists = cartRepository.existsByUserIdAndBookId(userId, bookId);

        if (exists) {
            throw new RuntimeException("Book already exists in cart");
        }

        return cartRepository.save(cart);
    }

    public List<Cart> getUserCart(Long userId) {
        return cartRepository.findByUserId(userId);
    }

    public String getUserNameByUserId(Long userId){
        User user = userRepository.findById(userId).get();
        String userName = user.getName();
        return userName;
    }

    public void removeFromCart(Long id, Long userId) {
        cartRepository.deleteByIdAndUserId(id, userId);
    }

    public void deleteAllByBook(Book book) {
        List<Cart> cartItems = cartRepository.findByBookId(book.getId());
        cartRepository.deleteAll(cartItems);
    }

    public List<Cart> getCartsByBookId(Long bookId) {
        return cartRepository.findByBookId(bookId);
    }
}
