package com.hustlehub.rentals.controller;

import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.rentals.dto.request.MakeOfferRequest;
import com.hustlehub.rentals.dto.response.ListingOfferResponse;
import com.hustlehub.rentals.dto.response.OfferAcceptResponse;
import com.hustlehub.rentals.service.ListingOfferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ListingOfferController {

    private final ListingOfferService listingOfferService;

    @PostMapping("/api/listings/{listingId}/offers")
    @ResponseStatus(HttpStatus.CREATED)
    public ListingOfferResponse makeOffer(@AuthenticationPrincipal AuthPrincipal principal,
                                           @PathVariable UUID listingId,
                                           @Valid @RequestBody MakeOfferRequest request) {
        return listingOfferService.makeOffer(listingId, principal.id(), request);
    }

    @GetMapping("/api/listings/{listingId}/offers")
    public List<ListingOfferResponse> getOffersForListing(@AuthenticationPrincipal AuthPrincipal principal,
                                                            @PathVariable UUID listingId) {
        return listingOfferService.getOffersForListing(listingId, principal.id());
    }

    @PostMapping("/api/offers/{id}/accept")
    public OfferAcceptResponse acceptOffer(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        return listingOfferService.acceptOffer(id, principal.id());
    }

    @PostMapping("/api/offers/{id}/reject")
    public ListingOfferResponse rejectOffer(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        return listingOfferService.rejectOffer(id, principal.id());
    }

    @PostMapping("/api/offers/{id}/withdraw")
    public ListingOfferResponse withdrawOffer(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        return listingOfferService.withdrawOffer(id, principal.id());
    }
}
