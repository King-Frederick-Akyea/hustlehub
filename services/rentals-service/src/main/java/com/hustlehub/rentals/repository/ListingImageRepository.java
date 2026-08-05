package com.hustlehub.rentals.repository;

import com.hustlehub.rentals.entity.Listing;
import com.hustlehub.rentals.entity.ListingImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ListingImageRepository extends JpaRepository<ListingImage, UUID> {

    List<ListingImage> findByListingOrderBySortOrderAsc(Listing listing);

    long countByListing(Listing listing);
}
