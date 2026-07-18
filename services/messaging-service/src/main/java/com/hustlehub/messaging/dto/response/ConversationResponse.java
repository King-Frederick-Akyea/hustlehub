package com.hustlehub.messaging.dto.response;

import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.messaging.entity.Conversation;

import java.time.Instant;
import java.util.UUID;

public record ConversationResponse(
        UUID id,
        UserSummaryResponse otherUser,
        UUID relatedTaskId,
        String lastMessage,
        Instant lastMessageAt,
        int unreadCount,
        Instant createdAt
) {
    public static ConversationResponse from(Conversation conversation, UserSummaryResponse otherUser,
                                             String lastMessage, int unreadCount) {
        return new ConversationResponse(
                conversation.getId(),
                otherUser,
                conversation.getRelatedTaskId(),
                lastMessage,
                conversation.getLastMessageAt(),
                unreadCount,
                conversation.getCreatedAt()
        );
    }
}
