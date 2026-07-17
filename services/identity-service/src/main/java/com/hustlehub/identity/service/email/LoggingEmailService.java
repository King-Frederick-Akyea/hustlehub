package com.hustlehub.identity.service.email;

import com.hustlehub.identity.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Default stand-in for real email delivery. Logs the code/token instead of sending it.
 * Active whenever app.mail.provider is unset or "logging"; {@link BrevoEmailService} takes
 * over when app.mail.provider=brevo.
 */
@Service
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "logging", matchIfMissing = true)
public class LoggingEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(LoggingEmailService.class);

    @Override
    public void sendVerificationCode(User user, String code) {
        log.info("[DEV EMAIL] Verification code for {}: {}", user.getEmail(), code);
    }

    @Override
    public void sendPasswordResetToken(User user, String token) {
        log.info("[DEV EMAIL] Password reset token for {}: {}", user.getEmail(), token);
    }
}
