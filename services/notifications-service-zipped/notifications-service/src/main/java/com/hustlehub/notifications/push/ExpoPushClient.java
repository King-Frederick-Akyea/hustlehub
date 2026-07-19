package com.hustlehub.notifications.push;

import com.hustlehub.common.exception.UpstreamServiceException;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

/**
 * Thin wrapper around Expo's push API (https://exp.host/--/api/v2/push/send) - mirrors
 * payments-service's PaystackClient house style (plain RestClient built in the constructor, no
 * injected Builder bean). No API key is required for basic push sends at this volume.
 */
@Component
public class ExpoPushClient {

    private static final String BASE_URL = "https://exp.host";

    private final RestClient restClient;

    public ExpoPushClient() {
        this.restClient = RestClient.create(BASE_URL);
    }

    /** Returns one ticket per token, in the same order as {@code tokens}. */
    public List<ExpoPushTicket> send(List<String> tokens, String title, String body, Map<String, Object> data) {
        List<ExpoPushMessage> messages = tokens.stream()
                .map(token -> new ExpoPushMessage(token, title, body, data, "default"))
                .toList();
        try {
            ExpoPushResponse response = restClient.post()
                    .uri("/--/api/v2/push/send")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(messages)
                    .retrieve()
                    .body(ExpoPushResponse.class);
            return response != null && response.data() != null ? response.data() : List.of();
        } catch (RestClientException e) {
            throw new UpstreamServiceException("Could not reach Expo push API: " + e.getMessage());
        }
    }

    private record ExpoPushMessage(String to, String title, String body, Map<String, Object> data, String sound) {
    }

    public record ExpoPushResponse(List<ExpoPushTicket> data) {
    }

    public record ExpoPushTicket(String status, String message, ExpoPushErrorDetails details) {
        public boolean isDeviceNotRegistered() {
            return "error".equals(status) && details != null && "DeviceNotRegistered".equals(details.error());
        }
    }

    public record ExpoPushErrorDetails(String error) {
    }
}
