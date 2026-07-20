package com.hustlehub.rentals.repository;

import com.hustlehub.rentals.entity.Listing;
import com.hustlehub.rentals.entity.ListingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ListingRepository extends JpaRepository<Listing, UUID> {

    List<Listing> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    // Type filtering happens in ListingService (in-memory) rather than as an optional JPQL
    // parameter here — same reasoning as TaskRepository's category filtering: binding a null
    // enum through "(:x is null or ...)" trips Postgres's JDBC type inference.
    List<Listing> findByStatusAndOwnerIdNotOrderByCreatedAtDesc(ListingStatus status, UUID excludeOwnerId);
}
