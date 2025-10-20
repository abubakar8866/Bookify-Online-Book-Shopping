package abubakar.bookapp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import abubakar.bookapp.models.ReturnReplacement;
import abubakar.bookapp.service.ReturnReplacementService;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequestMapping("/api/returns")
public class ReturnReplacementController {
    
    @Autowired
    private ReturnReplacementService service;

     //Create new return/replacement request (User)
    @PostMapping("/request")
    public ResponseEntity<?> createRequest(@RequestBody ReturnReplacement rr) {
        try {
            ReturnReplacement saved = service.createRequest(rr);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            // Return friendly error message if quantity exceeds available
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    //Get all requests of a user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReturnReplacement>> getUserRequests(@PathVariable Long userId) {
        List<ReturnReplacement> list = service.getRequestsByUser(userId);
        return ResponseEntity.ok(list);
    }

    //Get single request by ID (optional)
    @GetMapping("/{id}")
    public ResponseEntity<ReturnReplacement> getRequestById(@PathVariable Long id) {
        return service.getRequestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }    
}
