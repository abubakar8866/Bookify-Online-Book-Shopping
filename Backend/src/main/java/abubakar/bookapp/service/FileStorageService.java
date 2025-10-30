package abubakar.bookapp.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import abubakar.bookapp.exception.FileStorageException;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private final String uploadDir = System.getProperty("user.dir") + "/uploads";

    // Save a generic file and return its URL
    public String save(MultipartFile file) {
        ensureDirectoryExists(uploadDir);

        try {
            String originalName = file.getOriginalFilename();
            String extension = getExtension(originalName);
            String uniqueFileName = UUID.randomUUID().toString() + extension;

            Path filePath = Paths.get(uploadDir, uniqueFileName);
            Files.write(filePath, file.getBytes());

            return buildFileUrl("uploads/" + uniqueFileName);

        } catch (IOException ex) {
            throw new FileStorageException("Failed to save file: " + file.getOriginalFilename(), ex);
        }
    }

    // Save a profile image (organized by user ID)
    public String saveProfileImage(MultipartFile file, Long userId) {
        String profileDir = uploadDir + "/profile-images";
        ensureDirectoryExists(profileDir);

        try {
            String originalName = file.getOriginalFilename();
            String extension = getExtension(originalName);
            String uniqueFileName = "user-" + userId + "-" + UUID.randomUUID() + extension;

            Path filePath = Paths.get(profileDir, uniqueFileName);
            Files.write(filePath, file.getBytes());

            return buildFileUrl("uploads/profile-images/" + uniqueFileName);

        } catch (IOException ex) {
            throw new FileStorageException("Failed to save profile image for user ID " + userId, ex);
        }
    }

    // Save return/replacement image (organized by userId, orderId, itemId)
    public String saveReturnReplacementImage(MultipartFile file, Long userId, Long orderId, Long itemId) {
        String rrDir = uploadDir + "/return-replacement-images";
        ensureDirectoryExists(rrDir);

        try {
            String originalName = file.getOriginalFilename();
            String extension = getExtension(originalName);
            String uniqueFileName = String.format(
                    "user-%d_order-%d_item-%d_%s%s",
                    userId, orderId, itemId, UUID.randomUUID(), extension);

            Path filePath = Paths.get(rrDir, uniqueFileName);
            Files.write(filePath, file.getBytes());

            return buildFileUrl("uploads/return-replacement-images/" + uniqueFileName);

        } catch (IOException ex) {
            throw new FileStorageException("Failed to save return/replacement image", ex);
        }
    }

    // Delete a single file (safe)
    public void delete(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank())
            return;

        try {
            String relativePath = fileUrl.contains("/uploads/")
                    ? fileUrl.substring(fileUrl.lastIndexOf("/uploads/") + "/uploads/".length())
                    : fileUrl;

            Path filePath = Paths.get(uploadDir, relativePath);

            if (Files.exists(filePath)) {
                Files.delete(filePath);
                System.out.println("Deleted file: " + filePath);
            }

        } catch (IOException ex) {
            throw new FileStorageException("Failed to delete file: " + fileUrl, ex);
        }
    }

    // Delete multiple return/replacement images
    public void deleteReturnReplacementImages(List<String> urls) {
        if (urls == null || urls.isEmpty())
            return;

        for (String url : urls) {
            if (url != null && !url.isBlank()) {
                delete(url);
            }
        }
    }

    // Edit multiple images safely
    public List<String> editReturnReplacementImages(
            Long userId, Long orderId, Long itemId,
            List<String> oldUrls, List<MultipartFile> newFiles) {

        try {
            // Delete old images first
            deleteReturnReplacementImages(oldUrls);

            // Save new images
            List<String> result = new ArrayList<>();
            if (newFiles != null && !newFiles.isEmpty()) {
                for (MultipartFile file : newFiles) {
                    String url = saveReturnReplacementImage(file, userId, orderId, itemId);
                    result.add(url);
                }
            }
            return result;

        } catch (Exception ex) {
            throw new FileStorageException("Failed to update return/replacement images", ex);
        }
    }

    // Ensure upload directories exist
    private void ensureDirectoryExists(String path) {
        File dir = new File(path);
        if (!dir.exists() && !dir.mkdirs()) {
            throw new FileStorageException("Could not create upload directory: " + path);
        }
    }

    // Extract file extension safely
    private String getExtension(String filename) {
        if (filename == null || !filename.contains("."))
            return "";
        return filename.substring(filename.lastIndexOf("."));
    }

    // Build accessible file URL
    private String buildFileUrl(String relativePath) {
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/")
                .path(relativePath)
                .toUriString();
    }
    
}
