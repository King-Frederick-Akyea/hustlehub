package com.hustlehub.notifications.dto;

import com.hustlehub.notifications.entity.Notification;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String type,
        String title,
        String body,
        boolean read,
        UUID relatedEntityId,
        Instant createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getBody(),
                notification.isRead(),
                notification.getRelatedEntityId(),
                notification.getCreatedAt());
    }
}
