package abubakar.bookapp.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import abubakar.bookapp.models.Author;
import abubakar.bookapp.models.Book;
import abubakar.bookapp.payload.BookDTO;
import abubakar.bookapp.repository.AuthorRepository;
import abubakar.bookapp.repository.BookRepository;
import abubakar.bookapp.service.CartService;
import abubakar.bookapp.service.FileStorageService;
import abubakar.bookapp.service.WishlistService;
import jakarta.validation.Valid;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequestMapping("/api/books")
@PreAuthorize("hasRole('ADMIN')")
public class BookController {

    @Autowired
    private BookRepository bookRepo;

    @Autowired
    private AuthorRepository authorRepo;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private ObjectMapper mapper;

    @Autowired
    private WishlistService wishlistService;

    @Autowired
    private CartService cartService;

    // List all books (Admin only) with pagination
    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
            Page<Book> books = bookRepo.findAll(pageable);
            return ResponseEntity.ok(books);
        } catch (Exception ex) {
            // Unexpected issues like database error
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch books", ex);
        }
    }

    // Get a specific book by ID
    @GetMapping("/{id}")
    public ResponseEntity<Book> get(@PathVariable Long id) {
        Book book = bookRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
        return ResponseEntity.ok(book);
    }

    // Create book
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Book> create(
            @RequestPart("value") @Valid String valueJson,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        try {
            BookDTO dto = mapper.readValue(valueJson, BookDTO.class);

            // ✅ Validate author existence
            Author author = authorRepo.findById(dto.getAuthorId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Author not found"));

            if (dto.getPrice() == null || dto.getPrice().signum() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid price value");
            }

            Book book = new Book();
            book.setName(dto.getName().trim());
            book.setDescription(dto.getDescription().trim());
            book.setAuthor(author);
            book.setPrice(dto.getPrice());
            book.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : 5);

            if (file != null && !file.isEmpty()) {
                String imageUrl = fileStorageService.save(file);
                book.setImageUrl(imageUrl);
            }

            Book savedBook = bookRepo.save(book);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedBook);

        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JSON format for book data", e);
        } catch (ResponseStatusException e) {
            throw e; //already handled message
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create book", e);
        }
    }

    // Update book
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Book> update(
            @PathVariable Long id,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestPart(value = "value") @Valid String valueJson) {
        try {
            Book existing = bookRepo.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));

            BookDTO dto = mapper.readValue(valueJson, BookDTO.class);

            existing.setName(dto.getName().trim());
            existing.setDescription(dto.getDescription().trim());
            existing.setQuantity(dto.getQuantity());

            if (dto.getAuthorId() != null) {
                Author author = authorRepo.findById(dto.getAuthorId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid author ID"));
                existing.setAuthor(author);
            }

            if (dto.getPrice() != null && dto.getPrice().signum() > 0) {
                existing.setPrice(dto.getPrice());
            } else if (dto.getPrice() != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price must be positive");
            }

            // ✅ Handle image updates safely
            if (file != null && !file.isEmpty()) {
                if (existing.getImageUrl() != null) {
                    fileStorageService.delete(existing.getImageUrl());
                }
                String newUrl = fileStorageService.save(file);
                existing.setImageUrl(newUrl);
            } else if (dto.getImageUrl() != null && !dto.getImageUrl().isBlank()) {
                existing.setImageUrl(dto.getImageUrl());
            }

            Book updatedBook = bookRepo.save(existing);
            return ResponseEntity.ok(updatedBook);

        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JSON format", e);
        } catch (ResponseStatusException e) {
            throw e;
        }catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update book", e);
        }
    }

    // Delete book
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            Book existing = bookRepo.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));

            if (existing.getImageUrl() != null) {
                fileStorageService.delete(existing.getImageUrl());
            }

            wishlistService.deleteAllByBook(existing);
            cartService.deleteAllByBook(existing);

            bookRepo.deleteById(id);
            return ResponseEntity.noContent().build();

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete book", e);
        }
    }

    // Case-insensitive Search API
    @GetMapping("/search")
    public ResponseEntity<?> searchBooks(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        try {
            if (name == null || name.trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Search name cannot be empty");
            }
            Page<Book> result = bookRepo.findByNameContainingIgnoreCase(name.trim(), PageRequest.of(page, size));
            return ResponseEntity.ok(result);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Search failed", e);
        }
    }

}
