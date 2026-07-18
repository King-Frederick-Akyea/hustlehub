package com.hustlehub.payments.entity;

/**
 * Lifecycle of a single ledger row. PENDING rows never count toward completedBalance — a topup
 * only affects the balance once Paystack confirms it, and a withdrawal is earmarked (see
 * {@code WalletTransactionRepository.pendingWithdrawals}) but not yet subtracted from
 * completedBalance until it actually settles.
 */
public enum TransactionStatus {
    PENDING,
    COMPLETED,
    FAILED
}
