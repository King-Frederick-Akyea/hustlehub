package com.hustlehub.rentals.repository;

import com.hustlehub.rentals.entity.Listing;
import com.hustlehub.rentals.entity.ListingOffer;
import com.hustlehub.rentals.entity.OfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ListingOfferRepository extends JpaRepository<ListingOffer, UUID> {

    List<ListingOffer> findByListingOrderByCreatedAtDesc(Listing listing);

    long countByListing(Listing listing);

    List<ListingOffer> findByListingAndRequesterId(Listing listing, UUID requesterId);

    // Used to build the reviews-service "eligible to review" list — rentals/barter have no
    // explicit "completed" state, so an ACCEPTED offer is the eligibility bar (see
    // EngagementParticipantsResponse's javadoc in common).
    List<ListingOffer> findByRequesterIdAndStatus(UUID requesterId, OfferStatus status);

    List<ListingOffer> findByListing_OwnerIdAndStatus(UUID ownerId, OfferStatus status);
}
