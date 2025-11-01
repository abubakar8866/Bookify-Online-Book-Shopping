package abubakar.bookapp.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import abubakar.bookapp.models.Book;
import abubakar.bookapp.models.User;
import abubakar.bookapp.models.Wishlist;
import abubakar.bookapp.repository.BookRepository;
import abubakar.bookapp.repository.WishlistRepository;

@Service
public class WishlistService {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private BookRepository bookRepository;

    // Add book to wishlist
    public Wishlist addToWishlist(Long userId, Long bookId) {
        try {
            // Check if book exists
            Book book = bookRepository.findById(bookId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));

            // Check if already exists
            boolean exists = wishlistRepository.existsByUserIdAndBookId(userId, bookId);
            if (exists) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Book already exists in wishlist");
            }

            Wishlist wishlist = new Wishlist();
            wishlist.setUser(new User(userId));
            wishlist.setBook(book);

            return wishlistRepository.save(wishlist);

        } catch (ResponseStatusException e) {
            throw e; // rethrow handled by global handler
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to add book to wishlist");
        }
    }

    // Get wishlist by user
    public List<Wishlist> getUserWishlist(Long userId) {
        try {
            List<Wishlist> list = wishlistRepository.findByUserId(userId);
            if (list == null || list.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No books found in wishlist");
            }
            return list;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch wishlist");
        }
    }

    // Remove from wishlist
    public void removeFromWishlist(Long wishlistId, Long userId) {
        try {
            boolean exists = wishlistRepository.existsById(wishlistId);
            if (!exists) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Wishlist item not found");
            }

            wishlistRepository.deleteByIdAndUserId(wishlistId, userId);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to remove from wishlist");
        }
    }

    // Delete all wishlist items for a book
    public void deleteAllByBook(Book book) {
        try {
            List<Wishlist> wishlists = wishlistRepository.findByBookId(book.getId());
            wishlistRepository.deleteAll(wishlists);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete wishlists for book");
        }
    }

    // Get all wishlists for a book (admin)
    public List<Wishlist> getWishlistsByBookId(Long bookId) {
        try {
            return wishlistRepository.findByBookId(bookId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch wishlists by book ID");
        }
    }

}
