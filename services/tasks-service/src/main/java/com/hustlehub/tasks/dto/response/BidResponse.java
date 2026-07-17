package com.hustlehub.tasks.dto.response;

import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.tasks.entity.Bid;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BidResponse(
        UUID id,
        UUID taskId,
        UserSummaryResponse tasker,
        BigDecimal amount,
        String message,
        String deliveryTime,
        String status,
        Instant createdAt
) {
    /** {@code tasker} is pre-resolved by the service layer via UserServiceClient. */
    public static BidResponse from(Bid bid, UserSummaryResponse tasker) {
        return new BidResponse(
                bid.getId(),
                bid.getTask().getId(),
                tasker,
                bid.getAmount(),
                bid.getMessage(),
                bid.getDeliveryTime(),
                bid.getStatus().toJson(),
                bid.getCreatedAt()
        );
    }
}
