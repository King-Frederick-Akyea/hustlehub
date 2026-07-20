package com.hustlehub.notifications.entity;

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

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Plain column, no FK - cross-service, same reasoning as other services in this reactor:
    // no local users table.
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "body", nullable = false, length = 500)
    private String body;

    // Plain string, matching this reactor's convention for cross-service enum columns (e.g.
    // payments-service's TransactionType) rather than a JPA @Enumerated - keeps the DB decoupled
    // from common's NotificationType enum ordering/renames.
    @Column(name = "type", nullable = false, length = 40)
    private String type;

    // Nullable - the task/rental/conversation this notification is about, used by the frontend to
    // deep-link on tap. Null for wallet events.
    @Column(name = "related_entity_id")
    private UUID relatedEntityId;

    @Column(name = "read", nullable = false)
    @Builder.Default
    private boolean read = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
