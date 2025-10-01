package abubakar.bookapp.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import abubakar.bookapp.models.Author;
import abubakar.bookapp.models.Book;
import abubakar.bookapp.repository.AuthorRepository;
import abubakar.bookapp.repository.BookRepository;
import abubakar.bookapp.service.FileStorageService;
import abubakar.bookapp.payload.AuthorDTO;
import abubakar.bookapp.payload.AuthorNameDTO;
import abubakar.bookapp.payload.AuthorWithBookCountDTO;
import jakarta.validation.Valid;
import jakarta.validation.Validation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequestMapping("/api/authors")
public class AuthorController {

    private final AuthorRepository repo;
    private final BookRepository bookRepo;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    public AuthorController(AuthorRepository repo, BookRepository bookRepo,
            FileStorageService fileStorageService, ObjectMapper objectMapper) {
        this.repo = repo;
        this.bookRepo = bookRepo;
        this.fileStorageService = fileStorageService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "4") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Author> authorsPage = repo.findAll(pageable);

        // Map authors to DTO with book count
        Page<AuthorWithBookCountDTO> dtoPage = authorsPage.map(author -> new AuthorWithBookCountDTO(
                author.getId(),
                author.getName(),
                author.getDescription(),
                author.getImageUrl(),
                author.getGender(),
                author.getProgrammingLanguages(),
                bookRepo.countByAuthorId(author.getId())));

        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/names")
    public List<AuthorNameDTO> getAuthorNames() {
        return repo.findAll()
                .stream()
                .map(a -> new AuthorNameDTO(a.getId(), a.getName()))
                .collect(Collectors.toList());
    }

    @GetMapping("/all-books")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Book> getAllBooksForAdmin() {
        return bookRepo.findAll();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(
            @RequestPart("value") @Valid String valueJson,
            @RequestPart(value = "file", required = false) MultipartFile file) throws IOException {

        AuthorDTO dto = objectMapper.readValue(valueJson, AuthorDTO.class);

        // Validate DTO manually since we are deserializing from JSON
        var violations = Validation.buildDefaultValidatorFactory()
                .getValidator()
                .validate(dto);
        if (!violations.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(violations.stream()
                            .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                            .toList());
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("Image is required for new author");
        }

        Author author = new Author();
        author.setName(dto.getName());
        author.setDescription(dto.getDescription());
        author.setGender(dto.getGender());
        author.setProgrammingLanguages(dto.getProgrammingLanguages());
        author.setImageUrl(fileStorageService.save(file));

        return ResponseEntity.ok(repo.save(author));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestPart("value") String valueJson,
            @RequestPart(value = "file", required = false) MultipartFile file) throws IOException {

        Author existing = repo.findById(id).orElseThrow();

        AuthorDTO dto = objectMapper.readValue(valueJson, AuthorDTO.class);

        // Validate the DTO
        var violations = Validation.buildDefaultValidatorFactory()
                .getValidator()
                .validate(dto);
        if (!violations.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(violations.stream()
                            .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                            .toList());
        }

        // Update fields after validation passes
        existing.setName(dto.getName());
        existing.setDescription(dto.getDescription());
        existing.setGender(dto.getGender());
        existing.setProgrammingLanguages(dto.getProgrammingLanguages());

        // Handle optional image update
        if (file != null && !file.isEmpty()) {
            if (existing.getImageUrl() != null && !existing.getImageUrl().isBlank()) {
                fileStorageService.delete(existing.getImageUrl());
            }
            String imageUrl = fileStorageService.save(file);
            existing.setImageUrl(imageUrl);
        }

        return ResponseEntity.ok(repo.save(existing));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return repo.findById(id)
                .map(existing -> {
                    try {
                        repo.delete(existing);
                        repo.flush();

                        if (existing.getImageUrl() != null && !existing.getImageUrl().isBlank()) {
                            fileStorageService.delete(existing.getImageUrl());
                        }

                        return ResponseEntity.ok("Author deleted successfully");
                    } catch (Exception e) {
                        return ResponseEntity.status(400)
                                .body("Cannot delete author because it is referenced by books.");
                    }
                })
                .orElseGet(() -> ResponseEntity.status(404)
                        .body("Author not found with ID: " + id));
    }

}
