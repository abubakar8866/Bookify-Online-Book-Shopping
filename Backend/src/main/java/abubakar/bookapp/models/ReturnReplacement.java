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

    @Column(length = 150)
    private String customerName;

    @Column(length = 255)
    private String customerAddress;

    @Column(length = 15)
    private String customerPhone;

    @Column(nullable = true)
    private String paymentId;

    @Column(nullable = true)
    private Double refundedAmount;

    @Column(length = 20)
    private String type;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @ElementCollection
    @CollectionTable(name = "return_images", joinColumns = @JoinColumn(name = "return_id"))
    @Column(name = "image_url")
    private List<String> imageUrls;

    @Column(length = 20)
    private String status;

    private LocalDateTime requestedDate;
    private LocalDateTime processedDate;
    private LocalDateTime deliveryDate;

    @PrePersist
    protected void onCreate() {
        this.requestedDate = LocalDateTime.now();
    }
    
}
