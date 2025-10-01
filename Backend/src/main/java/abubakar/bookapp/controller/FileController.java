package abubakar.bookapp.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/files")
public class FileController {
    
    @Value("${file.upload-dir}")
    private String uploadDir;

    @SuppressWarnings("null")
    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) return ResponseEntity.badRequest().body("Empty file");
        String original = StringUtils.cleanPath(file.getOriginalFilename());
        String filename = System.currentTimeMillis() + "_" + original;

        Path path = Paths.get(uploadDir);
        if (!Files.exists(path)) Files.createDirectories(path);

        Files.copy(file.getInputStream(), path.resolve(filename));

        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
            .path("/uploads/")
            .path(filename)
            .toUriString();

        return ResponseEntity.ok(java.util.Map.of("url", url));
    }

    
}
