package abubakar.bookapp.controller;

import abubakar.bookapp.models.ReturnReplacement;
import abubakar.bookapp.service.ReturnReplacementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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
    @PostMapping("/request")
    public ResponseEntity<ReturnReplacement> createRequest(@RequestBody ReturnReplacement rr) {
        try {
            ReturnReplacement saved = service.createRequest(rr);
            return ResponseEntity.ok(saved);
        } catch (ResponseStatusException e) {
            // Automatically handled by Spring, no manual JSON building
            throw e;
        } catch (Exception e) {
            // Fallback for unexpected errors
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
