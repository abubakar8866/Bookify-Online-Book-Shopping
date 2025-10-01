package abubakar.bookapp.payload;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class AuthorDTO {
    
    @NotBlank(message = "Name is required")
    @Size(min = 3, max = 20, message = "Name must be between 3 and 20 characters")
    private String name;

    @NotBlank(message = "Description is required")
    @Size(min = 3, message = "Description must be at least 3 characters")
    private String description;

    @NotBlank(message = "Gender is required")
    private String gender;

    @Size(min = 1, message = "At least one programming language is required")
    private List<String> programmingLanguages;

}
