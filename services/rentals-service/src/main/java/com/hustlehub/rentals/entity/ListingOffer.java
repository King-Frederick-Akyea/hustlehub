package com.hustlehub.rentals.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.data.domain.Persistable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "listing_offers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingOffer implements Persistable<UUID> {

    // Application-assigned rather than @GeneratedValue: makeOffer needs to know a CASH offer's id
    // before the row exists, so it can key the escrow hold to it ahead of the insert (see
    // ListingOfferService.makeOffer). Every save path (including BARTER, which has no hold to key)
    // assigns id via the builder for consistency - see isNew() below for why this is required.
    @Id
    private UUID id;

    // Same-domain relation (Listing lives in this service too) — stays a real JPA relation.
    @ManyToOne(optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    // Cross-service reference (User lives in identity-service) — plain UUID column, no FK.
    @Column(name = "requester_id", nullable = false)
    private UUID requesterId;

    @Enumerated(EnumType.STRING)
    @Column(name = "offer_type", nullable = false, length = 6)
    private OfferType offerType;

    /** CASH rental offers only. */
    @Column(name = "duration_days")
    private Integer durationDays;

    /** BARTER offers only: what they're proposing. */
    @Column(name = "barter_message", columnDefinition = "TEXT")
    private String barterMessage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private OfferStatus status = OfferStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // Because id is always application-assigned (see above), it's non-null on brand-new instances
    // too, which would otherwise make Spring Data's default isNew() heuristic (id == null) think
    // this is an existing row and route save() through merge() instead of persist() - merge on a
    // row that doesn't exist yet fails with StaleObjectStateException. createdAt is populated by
    // Hibernate only at actual insert time, so it's a reliable "has this ever been persisted"
    // signal instead.
    @Override
    public boolean isNew() {
        return createdAt == null;
    }
}
