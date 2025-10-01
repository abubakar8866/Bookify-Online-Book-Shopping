package abubakar.bookapp.payload;

import lombok.Data;

@Data
public class ReviewRequestDTO {
    private String review;
    private Float rating;
}
