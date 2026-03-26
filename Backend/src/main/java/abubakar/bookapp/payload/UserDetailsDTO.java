package abubakar.bookapp.payload;

import lombok.Getter;

@Getter
public class UserDetailsDTO {

    private String name;
    private String address;

    public UserDetailsDTO(String name, String address) {
        this.name = name;
        this.address = address;
    }
    
}