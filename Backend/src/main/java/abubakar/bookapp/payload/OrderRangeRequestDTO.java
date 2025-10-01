package abubakar.bookapp.payload;

import lombok.*;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderRangeRequestDTO {
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
