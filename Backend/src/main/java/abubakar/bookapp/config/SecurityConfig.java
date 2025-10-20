package abubakar.bookapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import abubakar.bookapp.security.JwtAuthFilter;

import java.util.List;

@Configuration
@EnableMethodSecurity // Enables @PreAuthorize on methods
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/api/auth/login","/api/auth/register","/api/auth/email/**").permitAll()
                .requestMatchers("/api/auth/profile/**","/api/auth/books","/api/auth/authors").authenticated()
                .requestMatchers("/api/books/**").hasRole("ADMIN")
                .requestMatchers("/api/authors/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/orders/**").hasRole("ADMIN")
                .requestMatchers("/api/info/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/returns/**").hasRole("ADMIN")
                .requestMatchers("/api/user/books/**").hasRole("USER")
                .requestMatchers("/api/payment/**").hasRole("USER")
                .requestMatchers("/api/returns/**").hasRole("USER")
                .requestMatchers("/api/wishlist/**").hasAuthority("ROLE_USER")
                .requestMatchers("/api/cart/**").hasAuthority("ROLE_USER")
                .requestMatchers("/api/order/**").hasAuthority("ROLE_USER")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
