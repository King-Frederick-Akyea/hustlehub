package com.hustlehub.payments.entity;

/** Which way a ledger row moves money relative to {@code WalletTransaction.userId}'s balance. */
public enum Direction {
    CREDIT,
    DEBIT
}
