package com.hustlehub.common.client;

import com.hustlehub.common.config.InternalApiProperties;
import com.hustlehub.common.config.NotificationsServiceProperties;
import com.hustlehub.common.dto.NotificationType;
import com.hustlehub.common.dto.NotifySendRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Service
public class NotificationsServiceClientImpl implements NotificationsServiceClient {

    private static final Logger log = LoggerFactory.getLogger(NotificationsServiceClientImpl.class);
    private static final int TIMEOUT_MILLIS = 2000;

    private final RestClient restClient;
    private final InternalApiProperties internalApiProperties;

    // Built with RestClient.builder() rather than RestClient.create(baseUrl) - unlike the other
    // internal clients, this one needs an explicit short timeout: notify() is a best-effort side
    // effect that must never meaningfully delay the caller's real request, so an unbounded hang
    // (the JDK default) would break that promise even though an eventual exception wouldn't.
    public NotificationsServiceClientImpl(NotificationsServiceProperties notificationsServiceProperties, InternalApiProperties internalApiProperties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(TIMEOUT_MILLIS);
        requestFactory.setReadTimeout(TIMEOUT_MILLIS);
        this.restClient = RestClient.builder()
                .baseUrl(notificationsServiceProperties.getUrl())
                .requestFactory(requestFactory)
                .build();
        this.internalApiProperties = internalApiProperties;
    }

    // Never throws - always logs and swallows, same as PaymentsService.handlePaystackWebhook and
    // AuthService's password-reset-email send. A broken notifications-service must never fail the
    // caller's real operation.
    @Override
    public void notify(UUID userId, NotificationType type, String title, String body, UUID relatedEntityId) {
        try {
            restClient.post()
                    .uri("/internal/notifications/send")
                    .header(InternalApiProperties.HEADER_NAME, internalApiProperties.getKey())
                    .body(new NotifySendRequest(userId, type, title, body, relatedEntityId))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Failed to send notification (type={}, userId={}): {}", type, userId, e.getMessage());
        }
    }
}
