package com.hustlehub.reviews.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * {@code reviewerId}/{@code revieweeId} are plain UUID columns, not JPA relations - this service
 * has no {@code users} table (identity-service owns that). Resolve display info via
 * {@code UserServiceClient} at the response-building layer, not here. One row per
 * (reviewerId, relatedType, relatedId) - enforced by a DB unique constraint (see migration) so a
 * reviewer can't leave two reviews for the same engagement.
 */
@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reviewer_id", nullable = false)
    private UUID reviewerId;

    @Column(name = "reviewee_id", nullable = false)
    private UUID revieweeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "related_type", nullable = false, length = 15)
    private EngagementType relatedType;

    @Column(name = "related_id", nullable = false)
    private UUID relatedId;

    @Column(nullable = false)
    private int rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
