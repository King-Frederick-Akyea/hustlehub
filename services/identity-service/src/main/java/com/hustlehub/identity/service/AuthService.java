package com.hustlehub.identity.service;

import com.hustlehub.common.security.JwtProperties;
import com.hustlehub.common.security.UserRole;
import com.hustlehub.identity.dto.request.LoginRequest;
import com.hustlehub.identity.dto.request.RegisterRequest;
import com.hustlehub.identity.dto.response.AuthResponse;
import com.hustlehub.identity.dto.response.ForgotPasswordResponse;
import com.hustlehub.identity.dto.response.MessageResponse;
import com.hustlehub.identity.dto.response.TokenPairResponse;
import com.hustlehub.identity.entity.PasswordResetToken;
import com.hustlehub.identity.entity.RefreshToken;
import com.hustlehub.identity.entity.User;
import com.hustlehub.identity.entity.AccountStatus;
import com.hustlehub.identity.exception.EmailAlreadyExistsException;
import com.hustlehub.identity.exception.InvalidCredentialsException;
import com.hustlehub.identity.exception.InvalidOrExpiredTokenException;
import com.hustlehub.identity.exception.SuspendedAccountException;
import com.hustlehub.identity.repository.PasswordResetTokenRepository;
import com.hustlehub.identity.repository.RefreshTokenRepository;
import com.hustlehub.identity.repository.UserRepository;
import com.hustlehub.identity.security.JwtService;
import com.hustlehub.identity.service.email.EmailService;
import com.hustlehub.identity.util.CryptoUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private static final Duration RESET_TOKEN_VALIDITY = Duration.ofMinutes(30);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final VerificationService verificationService;
    private final EmailService emailService;
    private final UserService userService;

    @Value("${app.mail.dev-echo-enabled:false}")
    private boolean devEchoEnabled;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        User user = User.builder()
                .fullName(request.fullName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(UserRole.fromJson(request.role()))
                .build();
        user = userRepository.save(user);

        verificationService.issueEmailVerificationCode(user);

        return issueTokenPair(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        // Checked after credentials so a suspended user still just gets "invalid credentials" on
        // a wrong password, not a free confirmation their account exists and is suspended.
        if (user.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new SuspendedAccountException(user.getSuspensionReason());
        }
        return issueTokenPair(user);
    }

    @Transactional
    public TokenPairResponse refresh(String rawToken) {
        String tokenHash = CryptoUtils.sha256Hex(rawToken);
        RefreshToken existing = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidOrExpiredTokenException("Invalid refresh token"));

        if (existing.isRevoked()) {
            // Replay of an already-rotated-out token: treat as theft and kill every session.
            refreshTokenRepository.revokeAllActiveForUser(existing.getUser(), Instant.now());
            throw new InvalidOrExpiredTokenException("This session has been revoked. Please log in again.");
        }
        if (existing.isExpired()) {
            throw new InvalidOrExpiredTokenException("Refresh token has expired. Please log in again.");
        }

        User user = existing.getUser();
        // Caps how long a suspension can take to bite mid-session: the access token this issues
        // is short-lived (15 min default), and every refresh from here on is blocked, so a
        // suspended user is fully locked out within one more access-token lifetime at worst.
        if (user.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new SuspendedAccountException(user.getSuspensionReason());
        }
        IssuedRefreshToken rotated = createRefreshToken(user);
        existing.setRevokedAt(Instant.now());
        existing.setReplacedByTokenId(rotated.entity().getId());
        refreshTokenRepository.save(existing);

        String accessToken = jwtService.generateAccessToken(user);
        return new TokenPairResponse(accessToken, rotated.rawToken());
    }

    @Transactional
    public void logout(String rawToken) {
        String tokenHash = CryptoUtils.sha256Hex(rawToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            if (!token.isRevoked()) {
                token.setRevokedAt(Instant.now());
                refreshTokenRepository.save(token);
            }
        });
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(String email) {
        String genericMessage = "If an account exists for that email, a reset link has been sent.";
        return userRepository.findByEmailIgnoreCase(email.trim())
                .map(user -> {
                    String rawToken = CryptoUtils.generateOpaqueToken();
                    PasswordResetToken entity = PasswordResetToken.builder()
                            .user(user)
                            .tokenHash(CryptoUtils.sha256Hex(rawToken))
                            .expiresAt(Instant.now().plus(RESET_TOKEN_VALIDITY))
                            .build();
                    passwordResetTokenRepository.save(entity);
                    // Token is already persisted regardless of delivery outcome (dev-echo still works),
                    // so a broken email provider must never fail this request — log and move on.
                    try {
                        emailService.sendPasswordResetToken(user, rawToken);
                    } catch (Exception e) {
                        log.error("Failed to send password reset email to {}", user.getEmail(), e);
                    }
                    return new ForgotPasswordResponse(genericMessage, devEchoEnabled ? rawToken : null);
                })
                .orElse(new ForgotPasswordResponse(genericMessage, null));
    }

    @Transactional
    public MessageResponse resetPassword(String rawToken, String newPassword) {
        String tokenHash = CryptoUtils.sha256Hex(rawToken);
        PasswordResetToken entity = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidOrExpiredTokenException("Invalid or expired reset token"));
        if (entity.isConsumed() || entity.isExpired()) {
            throw new InvalidOrExpiredTokenException("Invalid or expired reset token");
        }

        User user = entity.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        entity.setConsumedAt(Instant.now());
        passwordResetTokenRepository.save(entity);

        refreshTokenRepository.revokeAllActiveForUser(user, Instant.now());

        return new MessageResponse("Password has been reset successfully. Please log in again.");
    }

    private AuthResponse issueTokenPair(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        IssuedRefreshToken refreshToken = createRefreshToken(user);
        return new AuthResponse(accessToken, refreshToken.rawToken(), userService.toResponse(user));
    }

    /**
     * Only the raw token is ever handed back to a caller; the persisted {@link RefreshToken}
     * entity keeps just the hash. Do not mutate the entity's tokenHash after this returns —
     * it's still managed by the persistence context and dirty-checking would flush the change.
     */
    private record IssuedRefreshToken(RefreshToken entity, String rawToken) {
    }

    private IssuedRefreshToken createRefreshToken(User user) {
        String rawToken = CryptoUtils.generateOpaqueToken();
        RefreshToken entity = RefreshToken.builder()
                .user(user)
                .tokenHash(CryptoUtils.sha256Hex(rawToken))
                .expiresAt(Instant.now().plus(jwtProperties.getRefreshTokenExpirationDays(), ChronoUnit.DAYS))
                .build();
        RefreshToken saved = refreshTokenRepository.save(entity);
        return new IssuedRefreshToken(saved, rawToken);
    }
}
