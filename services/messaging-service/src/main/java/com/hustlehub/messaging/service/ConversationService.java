package com.hustlehub.messaging.service;

import com.hustlehub.common.client.NotificationsServiceClient;
import com.hustlehub.common.client.UserServiceClient;
import com.hustlehub.common.dto.NotificationType;
import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.common.exception.InvalidRequestException;
import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.messaging.dto.request.StartConversationRequest;
import com.hustlehub.messaging.dto.response.ChatMessageResponse;
import com.hustlehub.messaging.dto.response.ConversationResponse;
import com.hustlehub.messaging.entity.Conversation;
import com.hustlehub.messaging.entity.Message;
import com.hustlehub.messaging.repository.ConversationRepository;
import com.hustlehub.messaging.repository.MessageRepository;
import com.hustlehub.messaging.service.storage.ChatImageStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserServiceClient userServiceClient;
    private final NotificationsServiceClient notificationsServiceClient;
    private final ChatImageStorageService chatImageStorageService;

    @Transactional
    public ConversationResponse startConversationWith(UUID currentUserId, UUID otherUserId, StartConversationRequest request) {
        if (otherUserId.equals(currentUserId)) {
            throw new InvalidRequestException("You cannot start a conversation with yourself");
        }
        // We don't need the full summary here, just the existence check — this is the only way
        // to confirm the other user actually exists now that identity-service owns that table.
        userServiceClient.getSummary(otherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UUID participantOneId = smallerOf(currentUserId, otherUserId);
        UUID participantTwoId = participantOneId.equals(currentUserId) ? otherUserId : currentUserId;

        Conversation conversation = conversationRepository.findByParticipantOneIdAndParticipantTwoId(participantOneId, participantTwoId)
                .orElseGet(() -> {
                    Conversation.ConversationBuilder builder = Conversation.builder()
                            .participantOneId(participantOneId)
                            .participantTwoId(participantTwoId);
                    // relatedTaskId is purely a display hint — no call to tasks-service to
                    // validate it exists, intentionally keeping this service dependent only on
                    // identity-service.
                    if (request != null && request.taskId() != null) {
                        builder.relatedTaskId(request.taskId());
                    }
                    return conversationRepository.save(builder.build());
                });

        return toResponse(conversation, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(UUID currentUserId) {
        List<Conversation> conversations = conversationRepository.findAllForUserOrderByRecentActivity(currentUserId);

        // Resolve every "other participant" in one batched call instead of one getSummary() per
        // conversation, to avoid an N+1 fan-out to identity-service on the list endpoint.
        List<UUID> otherUserIds = conversations.stream()
                .map(conversation -> otherParticipantId(conversation, currentUserId))
                .distinct()
                .toList();
        Map<UUID, UserSummaryResponse> otherUsersById = userServiceClient.getSummaries(otherUserIds).stream()
                .collect(Collectors.toMap(UserSummaryResponse::id, Function.identity()));

        return conversations.stream()
                .map(conversation -> {
                    UUID otherId = otherParticipantId(conversation, currentUserId);
                    UserSummaryResponse otherUser = otherUsersById.get(otherId);
                    if (otherUser == null) {
                        // Genuine data-inconsistency condition (identity-service doesn't know
                        // about a user this conversation references) — surface it rather than
                        // fabricating a placeholder participant.
                        throw new ResourceNotFoundException("User not found for conversation participant " + otherId);
                    }
                    return toResponse(conversation, currentUserId, otherUser);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ConversationResponse getConversation(UUID currentUserId, UUID conversationId) {
        Conversation conversation = findConversationOrThrow(conversationId);
        assertParticipant(conversation, currentUserId);
        return toResponse(conversation, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(UUID currentUserId, UUID conversationId) {
        Conversation conversation = findConversationOrThrow(conversationId);
        assertParticipant(conversation, currentUserId);
        return messageRepository.findByConversationOrderByCreatedAtAsc(conversation).stream()
                .map(message -> ChatMessageResponse.from(message, currentUserId))
                .toList();
    }

    @Transactional
    public ChatMessageResponse sendMessage(UUID currentUserId, UUID conversationId, String text) {
        Conversation conversation = findConversationOrThrow(conversationId);
        assertParticipant(conversation, currentUserId);

        Message message = Message.builder()
                .conversation(conversation)
                .senderId(currentUserId)
                .text(text.trim())
                .build();
        return saveAndNotify(conversation, message, currentUserId, message.getText());
    }

    /** Same as sendMessage, but with an image attached (and optional caption text) instead of/alongside plain text. */
    @Transactional
    public ChatMessageResponse sendImageMessage(UUID currentUserId, UUID conversationId, String text, MultipartFile file) {
        Conversation conversation = findConversationOrThrow(conversationId);
        assertParticipant(conversation, currentUserId);

        ChatImageStorageService.StoredFile stored = chatImageStorageService.store(conversationId, file);
        String trimmedText = (text != null && !text.isBlank()) ? text.trim() : null;

        Message message = Message.builder()
                .conversation(conversation)
                .senderId(currentUserId)
                .text(trimmedText)
                .imagePath(stored.storagePath())
                .imageContentType(stored.contentType())
                .build();
        return saveAndNotify(conversation, message, currentUserId, trimmedText != null ? trimmedText : "📷 Photo");
    }

    /** Returns the raw bytes + content type for a message's attached image — only a conversation participant may read it. */
    @Transactional(readOnly = true)
    public ImageData readMessageImage(UUID currentUserId, UUID conversationId, UUID messageId) {
        Conversation conversation = findConversationOrThrow(conversationId);
        assertParticipant(conversation, currentUserId);
        Message message = messageRepository.findById(messageId)
                .filter(m -> m.getConversation().getId().equals(conversationId))
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        if (message.getImagePath() == null) {
            throw new ResourceNotFoundException("This message has no image");
        }
        return new ImageData(chatImageStorageService.read(message.getImagePath()), message.getImageContentType());
    }

    public record ImageData(byte[] data, String contentType) {
    }

    private ChatMessageResponse saveAndNotify(Conversation conversation, Message message, UUID currentUserId, String notificationBody) {
        message = messageRepository.save(message);

        conversation.setLastMessageAt(message.getCreatedAt());
        conversationRepository.save(conversation);

        UUID recipientId = otherParticipantId(conversation, currentUserId);
        // Best-effort lookup for the notification title — a missing summary shouldn't block
        // sending the message itself, so we fall back to a generic label instead of throwing.
        String senderName = userServiceClient.getSummary(currentUserId)
                .map(UserSummaryResponse::fullName)
                .orElse("Someone");
        notificationsServiceClient.notify(recipientId, NotificationType.NEW_MESSAGE,
                "New message from " + senderName, notificationBody, conversation.getId());

        return ChatMessageResponse.from(message, currentUserId);
    }

    @Transactional
    public void markAsRead(UUID currentUserId, UUID conversationId) {
        Conversation conversation = findConversationOrThrow(conversationId);
        assertParticipant(conversation, currentUserId);
        messageRepository.markAsReadForRecipient(conversation, currentUserId, Instant.now());
    }

    private Conversation findConversationOrThrow(UUID conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
    }

    private void assertParticipant(Conversation conversation, UUID userId) {
        boolean isParticipant = conversation.getParticipantOneId().equals(userId)
                || conversation.getParticipantTwoId().equals(userId);
        if (!isParticipant) {
            throw new ForbiddenActionException("You are not a participant in this conversation");
        }
    }

    private UUID otherParticipantId(Conversation conversation, UUID currentUserId) {
        return conversation.getParticipantOneId().equals(currentUserId)
                ? conversation.getParticipantTwoId()
                : conversation.getParticipantOneId();
    }

    /** Single-conversation path (start/get) — resolves the other participant with one lookup. */
    private ConversationResponse toResponse(Conversation conversation, UUID currentUserId) {
        UUID otherId = otherParticipantId(conversation, currentUserId);
        UserSummaryResponse otherUser = userServiceClient.getSummary(otherId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for conversation participant " + otherId));
        return toResponse(conversation, currentUserId, otherUser);
    }

    private ConversationResponse toResponse(Conversation conversation, UUID currentUserId, UserSummaryResponse otherUser) {
        String lastMessage = messageRepository.findFirstByConversationOrderByCreatedAtDesc(conversation)
                .map(ConversationService::previewTextFor)
                .orElse(null);
        int unreadCount = messageRepository.countByConversationAndSenderIdNotAndReadAtIsNull(conversation, currentUserId);
        return ConversationResponse.from(conversation, otherUser, lastMessage, unreadCount);
    }

    /** An image-only message has no text (see Message's javadoc) - fall back to a photo indicator
     * instead of surfacing null, which the frontend would otherwise mistake for "no messages yet". */
    private static String previewTextFor(Message message) {
        if (message.getText() != null) {
            return message.getText();
        }
        return message.getImagePath() != null ? "📷 Photo" : null;
    }

    private UUID smallerOf(UUID a, UUID b) {
        return a.compareTo(b) < 0 ? a : b;
    }
}
