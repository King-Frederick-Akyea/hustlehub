package com.hustlehub.common.client;

import com.hustlehub.common.dto.ReviewStatsResponse;

import java.util.UUID;

/** Resolves a user's aggregate rating from reviews-service, embedded in identity-service's profile responses. */
public interface ReviewsServiceClient {

    /** Never throws - returns {@link ReviewStatsResponse#empty()} if reviews-service is unreachable, so a profile view never fails just because ratings couldn't load. */
    ReviewStatsResponse getStats(UUID userId);
}
