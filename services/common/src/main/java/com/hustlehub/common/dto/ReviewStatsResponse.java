package com.hustlehub.common.dto;

/** Aggregate rating for a user. Resolved from reviews-service via {@code ReviewsServiceClient}. */
public record ReviewStatsResponse(double averageRating, long reviewCount) {

    public static ReviewStatsResponse empty() {
        return new ReviewStatsResponse(0.0, 0L);
    }
}
