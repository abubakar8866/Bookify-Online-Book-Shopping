package abubakar.bookapp.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import com.razorpay.RazorpayException;

import java.util.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private Map<String, Object> createErrorBody(HttpStatus status, String error, String message,
            HttpServletRequest req) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", new Date());
        body.put("status", status.value());
        body.put("error", error);
        if (message != null)
            body.put("message", message);
        if (req != null)
            body.put("path", req.getRequestURI());
        return body;
    }

    // Validation errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex,
            HttpServletRequest req) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> fieldErrors.put(error.getField(), error.getDefaultMessage()));

        Map<String, Object> body = createErrorBody(HttpStatus.BAD_REQUEST, "Validation Failed", "Invalid input data",
                req);
        body.put("details", fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    // File too large
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxSizeException(MaxUploadSizeExceededException ex,
            HttpServletRequest req) {
        Map<String, Object> body = createErrorBody(HttpStatus.PAYLOAD_TOO_LARGE,
                "File size exceeds the allowed limit", ex.getMessage(), req);
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(body);
    }

    // Resource not found
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(ResourceNotFoundException ex,
            HttpServletRequest req) {
        Map<String, Object> body = createErrorBody(HttpStatus.NOT_FOUND, "Resource Not Found", ex.getMessage(), req);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    // File storage errors
    @ExceptionHandler(FileStorageException.class)
    public ResponseEntity<Map<String, Object>> handleFileStorageException(FileStorageException ex,
            HttpServletRequest req) {
        Map<String, Object> body = createErrorBody(HttpStatus.INTERNAL_SERVER_ERROR, "File Storage Error",
                ex.getMessage(), req);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    // Database constraint violation
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDatabaseConstraint(DataIntegrityViolationException ex,
            HttpServletRequest req) {
        Map<String, Object> body = createErrorBody(HttpStatus.BAD_REQUEST, "Database Constraint Violation",
                "Operation failed due to foreign key or unique constraint.", req);
        return ResponseEntity.badRequest().body(body);
    }

    // Razorpay-specific errors
    @ExceptionHandler(RazorpayException.class)
    public ResponseEntity<Map<String, Object>> handleRazorpayException(RazorpayException ex, HttpServletRequest req) {
        Map<String, Object> body = createErrorBody(HttpStatus.BAD_GATEWAY,
                "Razorpay API Error", ex.getMessage(), req);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(body);
    }

    // Handle ResponseStatusException (from services)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex,
            HttpServletRequest req) {
        Map<String, Object> body = createErrorBody(HttpStatus.valueOf(ex.getStatusCode().value()),
                "Request Failed", ex.getReason(), req);
        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }

    // Handle unexpected exceptions
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex, HttpServletRequest req) {
        Map<String, Object> body = createErrorBody(HttpStatus.INTERNAL_SERVER_ERROR,
                "Unexpected Error", ex.getMessage(), req);
        return ResponseEntity.internalServerError().body(body);
    }
    
}
