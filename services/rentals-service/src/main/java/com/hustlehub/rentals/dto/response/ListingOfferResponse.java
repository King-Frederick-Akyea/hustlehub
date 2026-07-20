package com.hustlehub.rentals.dto.response;

import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.rentals.entity.ListingOffer;

import java.time.Instant;
import java.util.UUID;

public record ListingOfferResponse(
        UUID id,
        UUID listingId,
        UUID requesterId,
        UserSummaryResponse requester,
        String offerType,
        Integer durationDays,
        String barterMessage,
        String status,
        Instant createdAt
) {
    /** {@code requester} is pre-resolved by the service layer via UserServiceClient. */
    public static ListingOfferResponse from(ListingOffer offer, UserSummaryResponse requester) {
        return new ListingOfferResponse(
                offer.getId(),
                offer.getListing().getId(),
                offer.getRequesterId(),
                requester,
                offer.getOfferType().toJson(),
                offer.getDurationDays(),
                offer.getBarterMessage(),
                offer.getStatus().toJson(),
                offer.getCreatedAt()
        );
    }
}
