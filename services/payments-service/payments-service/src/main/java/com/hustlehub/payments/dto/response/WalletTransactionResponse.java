package com.hustlehub.payments.dto.response;

import com.hustlehub.payments.entity.WalletTransaction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record WalletTransactionResponse(
        UUID id,
        String type,
        String direction,
        BigDecimal amount,
        String status,
        String description,
        UUID relatedUserId,
        UUID relatedEntityId,
        Instant createdAt,
        Instant completedAt
) {
    public static WalletTransactionResponse from(WalletTransaction transaction) {
        return new WalletTransactionResponse(
                transaction.getId(),
                transaction.getType(),
                transaction.getDirection().name(),
                transaction.getAmount(),
                transaction.getStatus().name(),
                transaction.getDescription(),
                transaction.getRelatedUserId(),
                transaction.getRelatedEntityId(),
                transaction.getCreatedAt(),
                transaction.getCompletedAt());
    }
}
