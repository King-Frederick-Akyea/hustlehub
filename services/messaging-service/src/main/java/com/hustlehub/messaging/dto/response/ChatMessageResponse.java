package com.hustlehub.messaging.dto.response;

import com.hustlehub.messaging.entity.Message;

import java.time.Instant;
import java.util.UUID;

/**
 * Named {@code ChatMessageResponse} (not {@code MessageResponse}) to match the monolith's
 * naming, which reserved {@code MessageResponse} for the generic {@code {message}} DTO used by
 * auth endpoints. This DTO only ever embeds a bare {@code senderId} (never a resolved
 * {@code UserSummaryResponse}), so building it needs no call to {@code UserServiceClient}.
 */
public record ChatMessageResponse(
        UUID id,
        UUID conversationId,
        UUID senderId,
        String text,
        String imageUrl,
        Instant createdAt,
        boolean isMine,
        boolean read
) {
    public static ChatMessageResponse from(Message message, UUID currentUserId) {
        String imageUrl = message.getImagePath() != null
                ? "/api/conversations/" + message.getConversation().getId() + "/messages/" + message.getId() + "/image"
                : null;
        return new ChatMessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getSenderId(),
                message.getText(),
                imageUrl,
                message.getCreatedAt(),
                message.getSenderId().equals(currentUserId),
                message.getReadAt() != null
        );
    }
}
