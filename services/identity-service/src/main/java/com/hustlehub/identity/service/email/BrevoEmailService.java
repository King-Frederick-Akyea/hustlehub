package com.hustlehub.identity.service.email;

import com.hustlehub.identity.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;

/**
 * Sends real email through Brevo's transactional email HTTP API (not SMTP — Brevo's API keys
 * are for this REST endpoint, not for SMTP auth, which needs a separate SMTP-specific credential).
 * Active only when app.mail.provider=brevo; {@link LoggingEmailService} is the default otherwise.
 *
 * API docs: https://developers.brevo.com/reference/sendtransacemail
 */
@Service
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "brevo")
public class BrevoEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(BrevoEmailService.class);
    private static final String BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";
    private static final String BRAND_COLOR = "#0052CC";

    // Built directly rather than injecting an auto-configured RestClient.Builder bean, which
    // isn't reliably available in this Boot 4.1 setup — RestClient.create() needs no Spring wiring.
    private final RestClient restClient = RestClient.create();

    @Value("${app.mail.brevo.api-key}")
    private String apiKey;

    @Value("${app.mail.from-address}")
    private String fromAddress;

    @Value("${app.mail.from-name:HustleHub}")
    private String fromName;

    @Override
    public void sendVerificationCode(User user, String code) {
        String subject = "Your HustleHub verification code";
        String html = wrapHtml(
                "Verify your email",
                "Hi " + escapeHtml(user.getFullName()) + ", use the code below to verify your HustleHub account.",
                code,
                "This code expires in 10 minutes."
        );
        String text = "Hi " + user.getFullName() + ",\n\nYour verification code is: " + code
                + "\n\nThis code expires in 10 minutes. If you didn't request this, you can safely ignore this email.";
        send(user.getEmail(), user.getFullName(), subject, html, text);
    }

    @Override
    public void sendPasswordResetToken(User user, String token) {
        String subject = "Reset your HustleHub password";
        String html = wrapHtml(
                "Reset your password",
                "Hi " + escapeHtml(user.getFullName()) + ", use the code below to reset your HustleHub password.",
                token,
                "This code expires in 30 minutes."
        );
        String text = "Hi " + user.getFullName() + ",\n\nUse this code to reset your password: " + token
                + "\n\nThis code expires in 30 minutes. If you didn't request this, you can safely ignore this email.";
        send(user.getEmail(), user.getFullName(), subject, html, text);
    }

    private void send(String toEmail, String toName, String subject, String htmlContent, String textContent) {
        BrevoEmailRequest payload = new BrevoEmailRequest(
                new BrevoEmailRequest.Sender(fromName, fromAddress),
                List.of(new BrevoEmailRequest.Recipient(toEmail, toName)),
                subject,
                htmlContent,
                textContent
        );

        try {
            ResponseEntity<String> response = restClient.post()
                    .uri(BREVO_SEND_EMAIL_URL)
                    .header("api-key", apiKey)
                    .header("accept", "application/json")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toEntity(String.class);
            log.info("Sent '{}' email to {} via Brevo (status {})", subject, toEmail, response.getStatusCode());
        } catch (RestClientResponseException e) {
            log.error("Brevo API rejected '{}' email to {}: {} {}", subject, toEmail, e.getStatusCode(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Failed to reach Brevo API sending '{}' email to {}", subject, toEmail, e);
        }
    }

    private String wrapHtml(String heading, String intro, String code, String expiryNote) {
        return """
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                  </head>
                  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f3f4f6; margin:0; padding:40px 20px;">
                    <table role="presentation" width="100%%" style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="background:%s; padding:28px 32px;">
                          <p style="margin:0; color:#ffffff; font-size:20px; font-weight:700;">HustleHub</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:32px;">
                          <h1 style="margin:0 0 12px 0; color:#111827; font-size:20px; font-weight:700;">%s</h1>
                          <p style="margin:0 0 24px 0; color:#4b5563; font-size:14px; line-height:1.6;">%s</p>
                          <div style="background:#f9fafb; border-radius:12px; padding:20px; text-align:center; margin-bottom:16px;">
                            <span style="font-size:32px; font-weight:700; letter-spacing:6px; color:%s;">%s</span>
                          </div>
                          <p style="margin:0; color:#9ca3af; font-size:12px; text-align:center;">%s</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 32px; background:#f9fafb; text-align:center;">
                          <p style="margin:0; color:#9ca3af; font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
                """.formatted(BRAND_COLOR, escapeHtml(heading), intro, BRAND_COLOR, escapeHtml(code), escapeHtml(expiryNote));
    }

    private String escapeHtml(String value) {
        return value == null ? "" : value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private record BrevoEmailRequest(
            Sender sender,
            List<Recipient> to,
            String subject,
            String htmlContent,
            String textContent
    ) {
        private record Sender(String name, String email) {
        }

        private record Recipient(String email, String name) {
        }
    }
}
