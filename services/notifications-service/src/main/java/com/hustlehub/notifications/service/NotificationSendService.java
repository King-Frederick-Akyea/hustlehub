package com.hustlehub.notifications.service;

import com.hustlehub.common.dto.NotifySendRequest;
import com.hustlehub.notifications.entity.DeviceToken;
import com.hustlehub.notifications.entity.Notification;
import com.hustlehub.notifications.push.ExpoPushClient;
import com.hustlehub.notifications.repository.DeviceTokenRepository;
import com.hustlehub.notifications.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Persist-then-push: the {@link Notification} row is written first and is the source of truth (in
 * -app history always works even if push delivery fails). The Expo push call is best-effort - any
 * failure is logged and swallowed here, never bubbles up to {@link
 * com.hustlehub.notifications.controller.InternalNotificationController}'s caller.
 */
@Service
@RequiredArgsConstructor
public class NotificationSendService {

    private static final Logger log = LoggerFactory.getLogger(NotificationSendService.class);

    private final NotificationRepository notificationRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final ExpoPushClient expoPushClient;

    @Transactional
    public void send(NotifySendRequest request) {
        Notification notification = Notification.builder()
                .userId(request.userId())
                .type(request.type().name())
                .title(request.title())
                .body(request.body())
                .relatedEntityId(request.relatedEntityId())
                .build();
        notificationRepository.save(notification);

        List<DeviceToken> tokens = deviceTokenRepository.findByUserId(request.userId());
        if (tokens.isEmpty()) {
            return;
        }
        try {
            pushToDevices(request, tokens);
        } catch (Exception e) {
            log.warn("Failed to deliver push notification to user {}: {}", request.userId(), e.getMessage());
        }
    }

    private void pushToDevices(NotifySendRequest request, List<DeviceToken> tokens) {
        List<String> tokenValues = tokens.stream().map(DeviceToken::getExpoPushToken).toList();
        Map<String, Object> data = new HashMap<>();
        data.put("type", request.type().name());
        if (request.relatedEntityId() != null) {
            data.put("relatedEntityId", request.relatedEntityId().toString());
        }

        List<ExpoPushClient.ExpoPushTicket> tickets =
                expoPushClient.send(tokenValues, request.title(), request.body(), data);

        // Expo's immediate response only confirms it *accepted* the message for delivery, not that
        // the OS actually delivered it - but an "error" ticket here (bad credentials, malformed
        // token, rate limit, etc.) means it never even got that far, and previously this was
        // silently discarded, making every non-DeviceNotRegistered failure invisible.
        for (int i = 0; i < tickets.size() && i < tokenValues.size(); i++) {
            ExpoPushClient.ExpoPushTicket ticket = tickets.get(i);
            if (ticket.isDeviceNotRegistered()) {
                deviceTokenRepository.deleteByExpoPushToken(tokenValues.get(i));
            } else if (!"ok".equals(ticket.status())) {
                log.warn("Expo push rejected for user {} (type {}): status={} message={} details={}",
                        request.userId(), request.type(), ticket.status(), ticket.message(), ticket.details());
            }
        }
    }
}
