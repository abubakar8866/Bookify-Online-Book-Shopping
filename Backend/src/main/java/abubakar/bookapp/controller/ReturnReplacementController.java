package abubakar.bookapp.controller;

import abubakar.bookapp.models.ReturnReplacement;
import abubakar.bookapp.service.ReturnReplacementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequestMapping("/api/returns")
public class ReturnReplacementController {

    @Autowired
    private ReturnReplacementService service;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * ✅ Create new return/replacement request (User side)
     */
    @PostMapping(value = "/request", consumes = { "multipart/form-data" })
    public ResponseEntity<?> createRequest(
            @RequestPart("value") String value,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) throws Exception {
        ReturnReplacement rr = objectMapper.readValue(value, ReturnReplacement.class);
        ReturnReplacement saved = service.createRequest(rr, images);
        return ResponseEntity.ok(saved);
    }

    /**
     * ✅ Get all requests of a specific user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReturnReplacement>> getUserRequests(@PathVariable Long userId) {
        List<ReturnReplacement> list = service.getRequestsByUser(userId);
        return ResponseEntity.ok(list);
    }

    /**
     * ✅ Get request by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReturnReplacement> getRequestById(@PathVariable Long id) {
        return service.getRequestById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND,
                        "Return/Replacement request not found with ID: " + id));
    }

    /**
     * Edit an existing return/replacement request (user or admin as per your auth
     * rules).
     */
    @PutMapping(value = "/{id}", consumes = { "multipart/form-data" })
    public ResponseEntity<?> editRequest(
            @PathVariable("id") Long id,
            @RequestPart("value") String value,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) throws Exception {

        ReturnReplacement updates = objectMapper.readValue(value, ReturnReplacement.class);
        ReturnReplacement updated = service.editRequest(id, updates, images);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a return/replacement request by id.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRequest(@PathVariable Long id) {
        service.deleteRequest(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

}
