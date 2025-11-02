package abubakar.bookapp.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Encoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtils {

    private SecretKey currentKey;
    private final long jwtExpirationMs = 86400000; // 1 day

    public void invalidateCurrentKey() {
        this.currentKey = null;
    }

    /** Generate a new random key for each login */
    private SecretKey generateRandomKey() {
        SecretKey newKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        String encoded = Encoders.BASE64.encode(newKey.getEncoded());
        System.out.println("New random JWT key generated: " + encoded);
        return newKey;
    }

    /** Generate a token with multiple roles */
    public String generateJwtToken(String username, String role) {
        this.currentKey = generateRandomKey(); // new key every login
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role) // store role as claim
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(currentKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUsernameFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(currentKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String getRoleFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(currentKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("role", String.class);
    }

    public boolean validateJwtToken(String token) {
        try {
            if (currentKey == null) {
                System.err.println("No active JWT signing key. Token validation failed.");
                return false;
            }
            Jwts.parserBuilder().setSigningKey(currentKey).build().parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            System.err.println("Invalid JWT token: " + e.getMessage());
            return false;
        }
    }

}
