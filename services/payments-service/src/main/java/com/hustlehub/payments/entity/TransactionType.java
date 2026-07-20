package com.hustlehub.payments.entity;

/**
 * String constants for {@code WalletTransaction.type} — kept as plain strings rather than a JPA
 * enum on purpose. TASK_PAYMENT/RENTAL_PAYMENT are the release-time credit type for escrows
 * funded by other services (tasks-service, rentals-service), so the column can't be backed by a
 * closed Java enum without this service rejecting types it doesn't know about yet (e.g. a type a
 * future service introduces). DEPOSIT/WITHDRAWAL/ESCROW_* are this service's own, set from these
 * constants so they can't drift from what the balance queries below filter on.
 */
public final class TransactionType {

    public static final String DEPOSIT = "DEPOSIT";
    public static final String WITHDRAWAL = "WITHDRAWAL";
    public static final String TASK_PAYMENT = "TASK_PAYMENT";
    public static final String RENTAL_PAYMENT = "RENTAL_PAYMENT";
    /** The debit that reserves funds when an escrow is first held. */
    public static final String ESCROW_HOLD = "ESCROW_HOLD";
    /** An additional debit when an existing hold is adjusted upward. */
    public static final String ESCROW_TOPUP = "ESCROW_TOPUP";
    /** A credit back to the payer: either adjusting a hold downward, or refunding it entirely. */
    public static final String ESCROW_REFUND = "ESCROW_REFUND";

    private TransactionType() {
    }
}
