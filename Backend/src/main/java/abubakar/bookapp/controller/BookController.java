package abubakar.bookapp.controller;

import java.io.IOException;

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
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Book> books = bookRepo.findAll(pageable);
        return ResponseEntity.ok(books);
    }

    // Get a specific book by ID
    @GetMapping("/{id}")
    public Book get(@PathVariable Long id) {
        return bookRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
    }

    // Create book
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Book> create(
            @RequestPart("value") @Valid String valueJson,
            @RequestPart(value = "file", required = false) MultipartFile file) throws IOException {

        BookDTO dto = mapper.readValue(valueJson, BookDTO.class);

        // Validate author
        Author author = authorRepo.findById(dto.getAuthorId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Author not found"));

        Book book = new Book();
        book.setName(dto.getName().trim());
        book.setDescription(dto.getDescription().trim());
        book.setAuthor(author);
        book.setPrice(dto.getPrice());
        book.setQuantity(dto.getQuantity());

        if (file != null && !file.isEmpty()) {
            String imageUrl = fileStorageService.save(file);
            book.setImageUrl(imageUrl);
        }

        Book savedBook = bookRepo.save(book);

        return ResponseEntity.ok(savedBook);
    }

    // Update book
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Book> update(
            @PathVariable Long id,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestPart(value = "value") @Valid String valueJson) throws IOException {

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

        if (dto.getPrice() != null) {
            existing.setPrice(dto.getPrice());
        }

        // Update image if new one provided
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
    }

    // Delete book
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Book existing = bookRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));

        if (existing.getImageUrl() != null) {
            fileStorageService.delete(existing.getImageUrl());
        }

        wishlistService.deleteAllByBook(existing);
        cartService.deleteAllByBook(existing);

        bookRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

}
