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
 * A single leg of the wallet ledger. Every money movement — a Paystack topup, a Paystack
 * withdrawal, or one side of an internal wallet-to-wallet transfer — is one row here; a transfer
 * between two users is always two rows (a DEBIT for the sender, a CREDIT for the recipient),
 * never a single row with two user ids. A user's balance is never stored directly, only derived
 * by summing their COMPLETED rows (see WalletTransactionRepository) — this is what makes the
 * ledger the single source of truth instead of a balance column that could drift from it.
 */
@Entity
@Table(name = "wallet_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Plain column, no FK - cross-service, same reasoning as other services in this reactor:
    // no local users table.
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    // Plain string, not an enum — see TransactionType for why.
    @Column(name = "type", nullable = false, length = 30)
    private String type;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 6)
    private Direction direction;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TransactionStatus status;

    /** Paystack's transaction/transfer reference. Null for internal transfer legs. */
    @Column(name = "paystack_reference", length = 100)
    private String paystackReference;

    /** The other party in an internal transfer (who paid / who was paid). Null for topups and withdrawals. */
    @Column(name = "related_user_id")
    private UUID relatedUserId;

    /** The task/rental/etc. this transfer is for, or null for topups and withdrawals. */
    @Column(name = "related_entity_id")
    private UUID relatedEntityId;

    @Column(name = "description", length = 255)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Set the moment this row settles (Paystack confirms it, or an internal transfer completes). */
    @Column(name = "completed_at")
    private Instant completedAt;
}
