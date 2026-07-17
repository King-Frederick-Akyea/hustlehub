package com.hustlehub.common.dto;

import java.util.UUID;

/** Returns a HELD escrow's full current amount back to whoever funded it (task cancelled, offer rejected/withdrawn/lost). */
public record EscrowRefundRequest(UUID relatedEntityId) {
}
