package com.hustlehub.common.dto;

import java.util.UUID;

/**
 * Server-side re-validation for {@code POST /api/reviews}: reviews-service never trusts a
 * client-submitted relatedType/relatedId, it looks up the real participants and eligibility
 * (task status == COMPLETED, or rental offer status == ACCEPTED) here first.
 */
public record EngagementParticipantsResponse(UUID partyAId, UUID partyBId, boolean eligible) {

    public boolean involves(UUID userId) {
        return partyAId.equals(userId) || partyBId.equals(userId);
    }

    public UUID otherParty(UUID userId) {
        return partyAId.equals(userId) ? partyBId : partyAId;
    }
}
