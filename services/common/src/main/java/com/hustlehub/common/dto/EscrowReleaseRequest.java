package com.hustlehub.common.dto;

import java.util.UUID;

/** Pays out a HELD escrow's full amount to beneficiaryId (the tasker, or the rental listing owner). */
public record EscrowReleaseRequest(UUID relatedEntityId, UUID beneficiaryId) {
}
