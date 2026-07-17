package com.hustlehub.common.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** Reserves funds from payerId's wallet against relatedEntityId (a task or rental offer). */
public record EscrowHoldRequest(
        UUID payerId,
        BigDecimal amount,
        /** e.g. "TASK", "RENTAL_OFFER" */
        String entityType,
        UUID relatedEntityId,
        String description
) {
}
