package com.hustlehub.rentals.service;

import com.hustlehub.common.client.UserServiceClient;
import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.common.exception.InvalidRequestException;
import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.rentals.dto.request.CreateListingRequest;
import com.hustlehub.rentals.dto.response.ListingResponse;
import com.hustlehub.rentals.entity.Listing;
import com.hustlehub.rentals.entity.ListingStatus;
import com.hustlehub.rentals.entity.ListingType;
import com.hustlehub.rentals.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final UserServiceClient userServiceClient;

    @Transactional
    public ListingResponse createListing(UUID ownerId, CreateListingRequest request) {
        ListingType type = ListingType.fromJson(request.type());

        Listing.ListingBuilder listing = Listing.builder()
                .ownerId(ownerId)
                .type(type)
                .title(request.title().trim())
                .description(trimToNull(request.description()));

        if (type == ListingType.RENTAL) {
            boolean hasRate = request.dailyRate() != null && request.dailyRate().compareTo(BigDecimal.ZERO) > 0;
            boolean barterAccepted = Boolean.TRUE.equals(request.barterAccepted());
            if (!hasRate && !barterAccepted) {
                throw new InvalidRequestException("A rental listing must accept cash, a barter trade, or both");
            }
            listing.dailyRate(hasRate ? request.dailyRate() : null)
                    .barterAccepted(barterAccepted)
                    .offering(null)
                    .seeking(trimToNull(request.seeking()));
        } else {
            String offering = trimToNull(request.offering());
            String seeking = trimToNull(request.seeking());
            if (offering == null || seeking == null) {
                throw new InvalidRequestException("Barter listings require both what you're offering and what you're seeking");
            }
            listing.dailyRate(null)
                    .barterAccepted(false)
                    .offering(offering)
                    .seeking(seeking);
        }

        Listing saved = listingRepository.save(listing.build());
        UserSummaryResponse owner = resolveRequiredSummary(ownerId);
        return ListingResponse.from(saved, owner);
    }

    public List<ListingResponse> getActiveListings(UUID currentUserId, String typeFilter) {
        ListingType filter = (typeFilter == null || typeFilter.isBlank()) ? null : ListingType.fromJson(typeFilter);

        List<Listing> listings = listingRepository.findByStatusAndOwnerIdNotOrderByCreatedAtDesc(ListingStatus.ACTIVE, currentUserId).stream()
                .filter(listing -> filter == null || listing.getType() == filter)
                .toList();

        Map<UUID, UserSummaryResponse> summaries = resolveSummaries(listings);
        return listings.stream()
                .map(listing -> ListingResponse.from(listing, summaries.get(listing.getOwnerId())))
                .toList();
    }

    public List<ListingResponse> getMyListings(UUID ownerId) {
        List<Listing> listings = listingRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        UserSummaryResponse owner = resolveRequiredSummary(ownerId);
        return listings.stream()
                .map(listing -> ListingResponse.from(listing, owner))
                .toList();
    }

    public ListingResponse getListing(UUID id) {
        Listing listing = findListingOrThrow(id);
        UserSummaryResponse owner = resolveRequiredSummary(listing.getOwnerId());
        return ListingResponse.from(listing, owner);
    }

    Listing findListingOrThrow(UUID id) {
        return listingRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Listing not found"));
    }

    void requireOwner(Listing listing, UUID userId) {
        if (!listing.getOwnerId().equals(userId)) {
            throw new ForbiddenActionException("Only the listing's owner can do this");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private UserSummaryResponse resolveRequiredSummary(UUID userId) {
        return userServiceClient.getSummary(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    /** Batches every owner id across the whole list into a single identity-service call. */
    private Map<UUID, UserSummaryResponse> resolveSummaries(List<Listing> listings) {
        Set<UUID> ids = new HashSet<>();
        for (Listing listing : listings) {
            ids.add(listing.getOwnerId());
        }
        return userServiceClient.getSummaries(ids).stream()
                .collect(Collectors.toMap(UserSummaryResponse::id, s -> s));
    }
}
