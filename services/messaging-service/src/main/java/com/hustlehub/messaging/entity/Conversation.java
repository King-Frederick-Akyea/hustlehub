package com.hustlehub.messaging.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * One thread per pair of users, matching the app's "conversation with a person" UI (not
 * per-task). {@code relatedTaskId} just records which task first started the conversation, for
 * context — later messages between the same two people about any task reuse this same thread.
 *
 * <p>This service owns neither a {@code users} table (identity-service does) nor a {@code tasks}
 * table (tasks-service does), so both participant references and the related-task reference are
 * plain UUID columns rather than JPA associations — there is nothing to {@code @ManyToOne} to.
 * {@code relatedTaskId} in particular is purely a display hint; it is never validated against
 * tasks-service, to keep this service's only cross-service dependency on identity-service.</p>
 */
@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "participant_one_id", nullable = false)
    private UUID participantOneId;

    @Column(name = "participant_two_id", nullable = false)
    private UUID participantTwoId;

    @Column(name = "related_task_id")
    private UUID relatedTaskId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;
}
