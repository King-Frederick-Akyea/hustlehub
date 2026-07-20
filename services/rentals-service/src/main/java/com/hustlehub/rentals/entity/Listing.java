package com.hustlehub.rentals.entity;

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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * {@code ownerId} is a plain UUID column, not a JPA relation — this service has no {@code users}
 * table (identity-service owns that). Resolve display info via {@code UserServiceClient} at the
 * response-building layer, not here.
 */
@Entity
@Table(name = "listings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ListingType type;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** RENTAL only; null = cash not accepted for this listing. */
    @Column(name = "daily_rate", precision = 10, scale = 2)
    private BigDecimal dailyRate;

    /** RENTAL only; true = owner will also/instead accept a trade. */
    @Column(name = "barter_accepted", nullable = false)
    @Builder.Default
    private boolean barterAccepted = false;

    /** BARTER only: what the owner has to offer. */
    @Column(length = 255)
    private String offering;

    /** BARTER: what they want; also RENTAL's barter preference when barterAccepted=true. */
    @Column(length = 255)
    private String seeking;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private ListingStatus status = ListingStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
