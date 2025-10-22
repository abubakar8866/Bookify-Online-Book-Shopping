package abubakar.bookapp.controller;

import abubakar.bookapp.models.ReturnReplacement;
import abubakar.bookapp.service.ReturnReplacementService;
import org.springframework.beans.factory.annotation.Autowired;
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

    /**
     * ✅ Create new return/replacement request (User side)
     */
    @PostMapping(value = "/request", consumes = { "multipart/form-data" })
    public ResponseEntity<?> createRequest(
            @RequestPart("value") String value,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            ReturnReplacement rr = mapper.readValue(value, ReturnReplacement.class);

            ReturnReplacement saved = service.createRequest(rr, images);
            return ResponseEntity.ok(saved);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unexpected error occurred: " + e.getMessage());
        }
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

}
