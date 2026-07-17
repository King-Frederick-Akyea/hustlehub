package com.hustlehub.common.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** Changes an existing HELD escrow to newAmount - tops up (charges more) if higher, refunds the difference if lower. */
public record EscrowAdjustRequest(UUID relatedEntityId, BigDecimal newAmount) {
}
