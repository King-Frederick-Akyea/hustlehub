package com.hustlehub.messaging.dto.request;

import java.util.UUID;

/**
 * Body is optional from the client's perspective — {@code taskId} is only used to record which
 * task first started the conversation, and only when a brand-new conversation is being created.
 */
public record StartConversationRequest(
        UUID taskId
) {
}
