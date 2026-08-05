package com.hustlehub.identity.security;

import com.hustlehub.common.security.JwtProperties;
import com.hustlehub.common.security.UserRole;
import com.hustlehub.identity.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

/**
 * Token *generation* stays identity-service-only, since only it owns password verification at
 * login time — every other service only ever needs to validate a token, which is what
 * {@code common}'s {@code JwtValidator} does, sharing the same {@code app.jwt.secret}.
 */
@Service
public class JwtService {

    private final JwtProperties jwtProperties;
    private SecretKey key;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    @PostConstruct
    void init() {
        this.key = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plus(jwtProperties.getAccessTokenExpirationMinutes(), ChronoUnit.MINUTES);
        return Jwts.builder()
                .setSubject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiry))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Mints a token for the hardcoded admin login (AdminAuthController) — there's no persisted
     * admin User row (see UserRole.ADMIN's javadoc), so unlike {@link #generateAccessToken}, this
     * doesn't take a User at all; the subject is a fixed synthetic id. This works because
     * common's JwtValidator only ever reads claims off the token, never looks anything up in a
     * database, so every service's existing JwtAuthenticationFilter recognizes ROLE_ADMIN for
     * free. Longer-lived than a normal access token (12h) and deliberately has no refresh-token
     * counterpart — refresh tokens are tied to a real persisted User via RefreshTokenRepository,
     * which this session doesn't have, so the admin just logs in again after 12h instead.
     */
    public String generateAdminAccessToken() {
        Instant now = Instant.now();
        Instant expiry = now.plus(12, ChronoUnit.HOURS);
        return Jwts.builder()
                .setSubject("00000000-0000-0000-0000-000000000000")
                .claim("email", "admin@hustlehub.internal")
                .claim("role", UserRole.ADMIN.name())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiry))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Optional<UUID> validateAndGetUserId(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return Optional.of(UUID.fromString(claims.getSubject()));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
