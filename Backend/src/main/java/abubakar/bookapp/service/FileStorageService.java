package abubakar.bookapp.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    private final String uploadDir = System.getProperty("user.dir") + "/uploads";

    // Save generic file and return URL
    public String save(MultipartFile file) throws IOException {
        ensureDirectoryExists(uploadDir);

        // Generate unique filename
        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }
        String uniqueFileName = UUID.randomUUID().toString() + extension;

        Path filePath = Paths.get(uploadDir, uniqueFileName);
        Files.write(filePath, file.getBytes());

        return buildFileUrl("uploads/" + uniqueFileName);
    }

    // Save profile image with userId in filename
    public String saveProfileImage(MultipartFile file, Long userId) throws IOException {
        String profileDir = uploadDir + "/profile-images";
        ensureDirectoryExists(profileDir);

        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }
        String uniqueFileName = "user-" + userId + "-" + UUID.randomUUID() + extension;

        Path filePath = Paths.get(profileDir, uniqueFileName);
        Files.write(filePath, file.getBytes());

        return buildFileUrl("uploads/profile-images/" + uniqueFileName);
    }

    // ✅ NEW: Save return/replacement images (organized by userId, orderId, itemId)
    public String saveReturnReplacementImage(MultipartFile file, Long userId, Long orderId, Long itemId)
            throws IOException {
        String rrDir = uploadDir + "/return-replacement-images";
        ensureDirectoryExists(rrDir);

        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }

        String uniqueFileName = "user-" + userId + "_order-" + orderId + "_item-" + itemId + "_" + UUID.randomUUID()
                + extension;
        Path filePath = Paths.get(rrDir, uniqueFileName);
        Files.write(filePath, file.getBytes());

        return buildFileUrl("uploads/return-replacement-images/" + uniqueFileName);
    }

    // Delete file by its URL or relative path
    public void delete(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank())
            return;

        String fileName = fileUrl;
        if (fileUrl.contains("/uploads/")) {
            fileName = fileUrl.substring(fileUrl.lastIndexOf("/uploads/") + "/uploads/".length());
        }

        Path filePath = Paths.get(uploadDir, fileName);

        try {
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                System.out.println("Deleted file: " + filePath);
            }
        } catch (IOException e) {
            System.err.println("Failed to delete file: " + filePath);
            e.printStackTrace();
        }
    }

    private void ensureDirectoryExists(String path) {
        File dir = new File(path);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    private String buildFileUrl(String relativePath) {
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/")
                .path(relativePath)
                .toUriString();
    }
}
