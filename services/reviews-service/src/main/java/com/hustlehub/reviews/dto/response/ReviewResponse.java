package com.hustlehub.reviews.dto.response;

import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.reviews.entity.Review;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
        UUID id,
        UUID reviewerId,
        UserSummaryResponse reviewer,
        UUID revieweeId,
        String relatedType,
        UUID relatedId,
        int rating,
        String comment,
        Instant createdAt
) {
    /** {@code reviewer} is pre-resolved by the service layer via UserServiceClient — this entity has no JPA relation to load it from. */
    public static ReviewResponse from(Review review, UserSummaryResponse reviewer) {
        return new ReviewResponse(
                review.getId(),
                review.getReviewerId(),
                reviewer,
                review.getRevieweeId(),
                review.getRelatedType().toJson(),
                review.getRelatedId(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
