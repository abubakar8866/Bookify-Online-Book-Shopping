package abubakar.bookapp.payload;

import lombok.*;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderRangeStatsDTO {
    private long orderCount = 0L;
    private BigDecimal orderTotal = BigDecimal.ZERO; 
}
