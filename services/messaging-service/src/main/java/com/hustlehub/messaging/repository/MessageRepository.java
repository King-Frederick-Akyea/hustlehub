package com.hustlehub.messaging.repository;

import com.hustlehub.messaging.entity.Conversation;
import com.hustlehub.messaging.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByConversationOrderByCreatedAtAsc(Conversation conversation);

    Optional<Message> findFirstByConversationOrderByCreatedAtDesc(Conversation conversation);

    int countByConversationAndSenderIdNotAndReadAtIsNull(Conversation conversation, UUID senderId);

    @Modifying
    @Query("update Message m set m.readAt = :now where m.conversation = :conversation and m.senderId <> :userId and m.readAt is null")
    void markAsReadForRecipient(@Param("conversation") Conversation conversation, @Param("userId") UUID userId, @Param("now") Instant now);
}
