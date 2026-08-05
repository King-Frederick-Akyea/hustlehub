package com.hustlehub.rentals.controller;

import com.hustlehub.common.config.InternalApiProperties;
import com.hustlehub.common.dto.CompletedEngagementResponse;
import com.hustlehub.common.dto.EngagementParticipantsResponse;
import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.rentals.service.ListingOfferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Resolves rental/barter-derived review eligibility for reviews-service (via {@code common}'s
 * {@code RentalsServiceClient}). Not reachable by end users — protected by a shared internal key
 * instead of a user JWT, checked here (see SecurityConfig, which permits /internal/** without authentication).
 */
@RestController
@RequestMapping("/internal/listings")
@RequiredArgsConstructor
public class InternalListingController {

    private final ListingOfferService listingOfferService;
    private final InternalApiProperties internalApiProperties;

    @GetMapping("/accepted-engagements/{userId}")
    public List<CompletedEngagementResponse> getAcceptedEngagements(@PathVariable UUID userId,
                                                                      @RequestHeader(value = InternalApiProperties.HEADER_NAME, required = false) String key) {
        requireInternalKey(key);
        return listingOfferService.getAcceptedEngagements(userId);
    }

    @GetMapping("/offers/{id}/participants")
    public EngagementParticipantsResponse getParticipants(@PathVariable UUID id,
                                                            @RequestHeader(value = InternalApiProperties.HEADER_NAME, required = false) String key) {
        requireInternalKey(key);
        return listingOfferService.getParticipants(id).orElseThrow(() -> new ResourceNotFoundException("Offer not found"));
    }

    @PostMapping("/suspend-cleanup/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void suspendCleanup(@PathVariable UUID userId,
                                @RequestHeader(value = InternalApiProperties.HEADER_NAME, required = false) String key) {
        requireInternalKey(key);
        listingOfferService.suspendCleanup(userId);
    }

    private void requireInternalKey(String provided) {
        if (provided == null || !internalApiProperties.getKey().equals(provided)) {
            throw new ForbiddenActionException("Invalid internal API key");
        }
    }
}
