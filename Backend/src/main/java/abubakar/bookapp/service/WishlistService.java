package abubakar.bookapp.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import abubakar.bookapp.models.Book;
import abubakar.bookapp.models.Wishlist;
import abubakar.bookapp.repository.WishlistRepository;

@Service
public class WishlistService {
    
    @Autowired
    private WishlistRepository wishlistRepository;

    public Wishlist addToWishlist(Wishlist wishlist) {
        Long userId = wishlist.getUser().getId();
        Long bookId = wishlist.getBook().getId();

        boolean exists = wishlistRepository.existsByUserIdAndBookId(userId, bookId);

        if (exists) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Book already exists in wishlist.");
        }

        return wishlistRepository.save(wishlist);
    }

    public List<Wishlist> getUserWishlist(Long userId) {
        return wishlistRepository.findByUserId(userId);
    }

    public void removeFromWishlist(Long id, Long userId) {
        wishlistRepository.deleteByIdAndUserId(id, userId);
    }

    public void deleteAllByBook(Book book) {
        List<Wishlist> wishlists = wishlistRepository.findByBookId(book.getId());
        wishlistRepository.deleteAll(wishlists);
    }

    public List<Wishlist> getWishlistsByBookId(Long bookId) {
        return wishlistRepository.findByBookId(bookId);
    }
}

