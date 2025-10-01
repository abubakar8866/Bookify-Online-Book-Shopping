package abubakar.bookapp.models;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Review {
    private String comment;
    private Float rating;
}
