package com.hustlehub.reviews.dto.response;

import com.hustlehub.common.dto.UserSummaryResponse;

import java.time.Instant;
import java.util.UUID;

/** One completed/accepted engagement the current user can still write a review for (see ReviewService.getEligible). */
public record EligibleEngagementResponse(
        String relatedType,
        UUID relatedId,
        UserSummaryResponse otherParty,
        Instant engagedAt
) {
}
