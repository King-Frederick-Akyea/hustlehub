package com.hustlehub.common.dto;

import java.util.UUID;

/** Body for POST /internal/notifications/send. relatedEntityId is nullable (e.g. wallet events have no related task/rental/conversation). */
public record NotifySendRequest(
        UUID userId,
        NotificationType type,
        String title,
        String body,
        UUID relatedEntityId
) {
}
