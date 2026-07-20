package com.hustlehub.rentals.dto.response;

import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.rentals.entity.Listing;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ListingResponse(
        UUID id,
        UUID ownerId,
        UserSummaryResponse owner,
        String type,
        String title,
        String description,
        BigDecimal dailyRate,
        boolean barterAccepted,
        String offering,
        String seeking,
        String status,
        Instant createdAt
) {
    /** {@code owner} is pre-resolved by the service layer via UserServiceClient — this entity has
     * no JPA relation to load it from (no users table in this service). */
    public static ListingResponse from(Listing listing, UserSummaryResponse owner) {
        return new ListingResponse(
                listing.getId(),
                listing.getOwnerId(),
                owner,
                listing.getType().toJson(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getDailyRate(),
                listing.isBarterAccepted(),
                listing.getOffering(),
                listing.getSeeking(),
                listing.getStatus().toJson(),
                listing.getCreatedAt()
        );
    }
}
