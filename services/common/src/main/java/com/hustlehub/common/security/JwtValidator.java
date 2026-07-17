package com.hustlehub.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;

/**
 * The verify-and-extract-claims half of what used to be {@code JwtService} in the monolith.
 * Every service trusts the same HMAC secret (shared via {@code app.jwt.secret} config), so any
 * service can authenticate a request from the token alone — token *generation* stays
 * identity-service-only, since only it owns password verification at login time.
 */
@Service
public class JwtValidator {

    private final JwtProperties jwtProperties;
    private SecretKey key;

    public JwtValidator(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    @PostConstruct
    void init() {
        this.key = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public Optional<AuthPrincipal> validateAndGetPrincipal(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            UUID id = UUID.fromString(claims.getSubject());
            String email = claims.get("email", String.class);
            UserRole role = UserRole.valueOf(claims.get("role", String.class));
            return Optional.of(new AuthPrincipal(id, email, role));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
