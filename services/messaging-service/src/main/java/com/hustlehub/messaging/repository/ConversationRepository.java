package com.hustlehub.messaging.repository;

import com.hustlehub.messaging.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    Optional<Conversation> findByParticipantOneIdAndParticipantTwoId(UUID participantOneId, UUID participantTwoId);

    /**
     * Explicit NULLS LAST — Postgres defaults DESC ordering to NULLS FIRST, which would push
     * brand-new (no-messages-yet) conversations to the top instead of the bottom. Falls back to
     * createdAt desc as a tiebreaker for conversations that share a null lastMessageAt.
     *
     * <p>(The monolith also had a
     * {@code findByParticipantOneOrParticipantTwoOrderByLastMessageAtDesc} derived-query method
     * here, superseded by this one for NULLS LAST ordering — it was never actually called
     * anywhere, so it's dropped rather than ported.)</p>
     */
    @Query("select c from Conversation c where c.participantOneId = :userId or c.participantTwoId = :userId " +
            "order by c.lastMessageAt desc nulls last, c.createdAt desc")
    List<Conversation> findAllForUserOrderByRecentActivity(@Param("userId") UUID userId);
}
