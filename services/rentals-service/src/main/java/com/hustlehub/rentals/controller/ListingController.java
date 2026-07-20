package com.hustlehub.rentals.controller;

import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.rentals.dto.request.CreateListingRequest;
import com.hustlehub.rentals.dto.response.ListingResponse;
import com.hustlehub.rentals.service.ListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ListingResponse createListing(@AuthenticationPrincipal AuthPrincipal principal,
                                          @Valid @RequestBody CreateListingRequest request) {
        return listingService.createListing(principal.id(), request);
    }

    @GetMapping
    public List<ListingResponse> browseListings(@AuthenticationPrincipal AuthPrincipal principal,
                                                 @RequestParam(required = false) String type) {
        return listingService.getActiveListings(principal.id(), type);
    }

    @GetMapping("/mine")
    public List<ListingResponse> myListings(@AuthenticationPrincipal AuthPrincipal principal) {
        return listingService.getMyListings(principal.id());
    }

    @GetMapping("/{id}")
    public ListingResponse getListing(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        return listingService.getListing(id);
    }
}
