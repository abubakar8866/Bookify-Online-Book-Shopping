package abubakar.bookapp.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "authors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Author {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String imageUrl;

    private String gender; 

    @ElementCollection
    @CollectionTable(
        name = "author_programming_languages",
        joinColumns = @JoinColumn(name = "author_id")
    )
    @Column(name = "language")
    private List<String> programmingLanguages; 
}
