package abubakar.bookapp.payload;

import java.time.LocalDate;

import lombok.Data;

@Data
public class OrderUpdateDTO {
    private String userName;
    private String address;
    private String phoneNumber;
    private LocalDate deliveryDate;
}
