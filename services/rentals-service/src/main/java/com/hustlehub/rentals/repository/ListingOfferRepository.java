package com.hustlehub.rentals.repository;

import com.hustlehub.rentals.entity.Listing;
import com.hustlehub.rentals.entity.ListingOffer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ListingOfferRepository extends JpaRepository<ListingOffer, UUID> {

    List<ListingOffer> findByListingOrderByCreatedAtDesc(Listing listing);
}
