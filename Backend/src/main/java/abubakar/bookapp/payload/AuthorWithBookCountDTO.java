package abubakar.bookapp.payload;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AuthorWithBookCountDTO {
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private String gender;
    private List<String> programmingLanguages;
    private Long bookCount;
}
