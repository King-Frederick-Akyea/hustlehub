package com.hustlehub.tasks.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bids")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Same-domain relation (Task lives in this service too) — stays a real JPA relation.
    @ManyToOne(optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    // Cross-service reference (User lives in identity-service) — plain UUID column, no FK.
    @Column(name = "tasker_id", nullable = false)
    private UUID taskerId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(length = 500)
    private String message;

    @Column(name = "delivery_time", length = 100)
    private String deliveryTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BidStatus status = BidStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
