package com.hustlehub.payments.entity;

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
 * One row per task or rental offer that has ever held funds - created at HELD, updated in place
 * as the amount is adjusted (a poster accepting a bid at a different price than the budget), and
 * resolved exactly once to RELEASED or REFUNDED. Never re-created for the same relatedEntityId
 * (see the unique index in V3) - this row IS the current state of that hold, not a log of holds.
 */
@Entity
@Table(name = "escrows")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Escrow {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "payer_id", nullable = false)
    private UUID payerId;

    @Column(name = "entity_type", nullable = false, length = 20)
    private String entityType;

    @Column(name = "related_entity_id", nullable = false)
    private UUID relatedEntityId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EscrowStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
