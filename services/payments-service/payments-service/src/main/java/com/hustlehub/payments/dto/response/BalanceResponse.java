package com.hustlehub.payments.dto.response;

import java.math.BigDecimal;

/**
 * {@code pending} is how much of {@code completedBalance} is currently earmarked for
 * not-yet-settled withdrawals — it's {@code completedBalance - available}, not a separate figure.
 * {@code held} is the total currently reserved across every active escrow (open tasks/rental
 * offers this user has funded) — already excluded from {@code available} since a hold is a real
 * completed debit the moment it's placed, but broken out here so the UI can show *why* available
 * is lower than "everything I've ever deposited," not just the number itself.
 */
public record BalanceResponse(BigDecimal available, BigDecimal pending, BigDecimal held) {
}
