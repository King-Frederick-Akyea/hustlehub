package com.hustlehub.common.client;

import com.hustlehub.common.dto.NotificationType;

import java.util.UUID;

/**
 * Fire-and-forget notification dispatch. Unlike {@link PaymentsServiceClient}, {@code notify(...)}
 * never throws - a notifications-service outage or a slow/failed push send must never fail the
 * caller's real business transaction (posting a task, accepting a bid, settling a payment). Any
 * problem is caught, logged, and swallowed inside the implementation.
 */
public interface NotificationsServiceClient {

    /**
     * @param relatedEntityId nullable - the task/rental/conversation this notification is about,
     *                         used by the frontend to deep-link on tap. Null for wallet events.
     */
    void notify(UUID userId, NotificationType type, String title, String body, UUID relatedEntityId);
}
