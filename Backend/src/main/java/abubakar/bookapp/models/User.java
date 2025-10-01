package abubakar.bookapp.models;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    public User(Long id) {
        this.id = id;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    private String password;

    private String role = "ROLE_USER";

    private String resetToken;

    private LocalDateTime tokenExpiry;

    @Column(nullable = true)
    private String imageUrl;

    @Column(nullable = false, columnDefinition = "VARCHAR(10) DEFAULT 'male'")
    private String gender = "male";

    @Column(nullable = true)
    private String address;

    @Column(nullable = true)
    private String favouriteBook;

    @Column(nullable = true)
    private String favouriteAuthor;
    
}
