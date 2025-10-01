package abubakar.bookapp.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    @JsonBackReference
    private Order order;

    @Column(nullable = false)
    private Long bookId; 

    @Column(nullable = false)
    private String bookName;

    @Column(nullable = true)
    private String authorName;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private float unitPrice;

    @Column(nullable = false)
    private float subtotal;

    @Column(columnDefinition = "TEXT")
    private String review;

    private Float rating;
}
