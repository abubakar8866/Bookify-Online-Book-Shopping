package abubakar.bookapp.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "return_replacement")
public class ReturnReplacement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private Long bookId;

    @Column(length = 200)
    private String bookTitle;

    @Column(length = 150)
    private String bookAuthor;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = true)
    private String paymentId;       // Razorpay payment ID

    @Column(nullable = true)
    private Double refundedAmount; // in INR

    @Column(length = 20)
    private String type; // "RETURN" or "REPLACEMENT"

    @Column(columnDefinition = "TEXT")
    private String reason;

    // Optional multiple image URLs
    @ElementCollection
    @CollectionTable(
        name = "return_images",
        joinColumns = @JoinColumn(name = "return_id")
    )
    @Column(name = "image_url")
    private List<String> imageUrls;

    @Column(length = 20)
    private String status; // PENDING, APPROVED, REJECTED, REFUNDED, REPLACED

    private LocalDateTime requestedDate;
    private LocalDateTime processedDate;
    private LocalDateTime deliveryDate;

    @PrePersist
    protected void onCreate(){
        this.requestedDate = LocalDateTime.now();
    }
}
