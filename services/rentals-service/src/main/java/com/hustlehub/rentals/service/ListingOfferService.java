package com.hustlehub.rentals.service;

import com.hustlehub.common.client.NotificationsServiceClient;
import com.hustlehub.common.client.PaymentsServiceClient;
import com.hustlehub.common.client.UserServiceClient;
import com.hustlehub.common.dto.NotificationType;
import com.hustlehub.common.dto.TransferResult;
import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.common.exception.InvalidRequestException;
import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.rentals.dto.request.MakeOfferRequest;
import com.hustlehub.rentals.dto.response.ListingOfferResponse;
import com.hustlehub.rentals.dto.response.OfferAcceptResponse;
import com.hustlehub.rentals.entity.Listing;
import com.hustlehub.rentals.entity.ListingOffer;
import com.hustlehub.rentals.entity.ListingStatus;
import com.hustlehub.rentals.entity.ListingType;
import com.hustlehub.rentals.entity.OfferStatus;
import com.hustlehub.rentals.entity.OfferType;
import com.hustlehub.rentals.repository.ListingOfferRepository;
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
public class ListingOfferService {

    private final ListingOfferRepository listingOfferRepository;
    private final ListingRepository listingRepository;
    private final ListingService listingService;
    private final UserServiceClient userServiceClient;
    private final PaymentsServiceClient paymentsServiceClient;
    private final NotificationsServiceClient notificationsServiceClient;

    @Transactional
    public ListingOfferResponse makeOffer(UUID listingId, UUID requesterId, MakeOfferRequest request) {
        Listing listing = listingService.findListingOrThrow(listingId);
        if (listing.getOwnerId().equals(requesterId)) {
            throw new ForbiddenActionException("You cannot make an offer on your own listing");
        }
        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new InvalidRequestException("This listing is no longer accepting offers");
        }

        OfferType offerType = OfferType.fromJson(request.offerType());
        // Id is application-assigned (see ListingOffer) for every offer, not just CASH ones, so
        // that isNew()/persist() behaves consistently regardless of offer type.
        UUID offerId = UUID.randomUUID();
        ListingOffer.ListingOfferBuilder offer = ListingOffer.builder()
                .id(offerId)
                .listing(listing)
                .requesterId(requesterId)
                .offerType(offerType);

        if (offerType == OfferType.CASH) {
            if (listing.getDailyRate() == null) {
                throw new InvalidRequestException("This listing doesn't accept cash offers");
            }
            if (request.durationDays() == null || request.durationDays() < 1) {
                throw new InvalidRequestException("Duration must be at least 1 day");
            }
            offer.durationDays(request.durationDays()).barterMessage(null);

            // Funds are reserved the moment a cash offer is made, not when it's accepted - the
            // offer id is pre-generated (above) so the escrow can be keyed by it before the row exists.
            BigDecimal amount = listing.getDailyRate().multiply(BigDecimal.valueOf(request.durationDays()));
            TransferResult hold = paymentsServiceClient.hold(requesterId, amount, "RENTAL_OFFER", offerId,
                    "Rental offer: " + listing.getTitle());
            if (!hold.success()) {
                throw new InvalidRequestException("Insufficient wallet balance to make this offer. Top up your wallet and try again.");
            }
        } else {
            boolean listingAcceptsBarter = (listing.getType() == ListingType.RENTAL && listing.isBarterAccepted())
                    || listing.getType() == ListingType.BARTER;
            if (!listingAcceptsBarter) {
                throw new InvalidRequestException("This listing doesn't accept barter offers");
            }
            if (request.barterMessage() == null || request.barterMessage().isBlank()) {
                throw new InvalidRequestException("A message describing your barter proposal is required");
            }
            offer.durationDays(null).barterMessage(request.barterMessage().trim());
        }

        ListingOffer saved = listingOfferRepository.save(offer.build());
        UserSummaryResponse requester = resolveRequiredSummary(requesterId);

        String offerDescription = offerType == OfferType.CASH
                ? "offered GH₵" + listing.getDailyRate().multiply(BigDecimal.valueOf(request.durationDays()))
                : "made a barter offer";
        notificationsServiceClient.notify(listing.getOwnerId(), NotificationType.RENTAL_OFFER_RECEIVED,
                "New offer on your listing",
                requester.fullName() + " " + offerDescription + " on \"" + listing.getTitle() + "\"",
                listing.getId());

        return ListingOfferResponse.from(saved, requester);
    }

    public List<ListingOfferResponse> getOffersForListing(UUID listingId, UUID currentUserId) {
        Listing listing = listingService.findListingOrThrow(listingId);
        listingService.requireOwner(listing, currentUserId);

        List<ListingOffer> offers = listingOfferRepository.findByListingOrderByCreatedAtDesc(listing);
        Map<UUID, UserSummaryResponse> summaries = resolveSummaries(offers);
        return offers.stream()
                .map(offer -> ListingOfferResponse.from(offer, summaries.get(offer.getRequesterId())))
                .toList();
    }

    @Transactional
    public OfferAcceptResponse acceptOffer(UUID offerId, UUID currentUserId) {
        ListingOffer offer = findOfferOrThrow(offerId);
        Listing listing = offer.getListing();
        listingService.requireOwner(listing, currentUserId);
        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new InvalidRequestException("This listing is no longer active");
        }
        if (offer.getStatus() != OfferStatus.PENDING) {
            throw new InvalidRequestException("This offer is no longer pending");
        }

        boolean paymentFailed = false;
        String paymentFailureReason = null;

        // The renter's funds were already reserved when they made the offer (see makeOffer) - accepting
        // just releases the held escrow to the listing owner. This stays soft/tolerant (unlike a hard
        // failure) because the offer/listing state change is still meaningful to record even if the
        // release has a problem; paymentFailed surfaces that to the frontend instead.
        if (offer.getOfferType() == OfferType.CASH) {
            try {
                paymentsServiceClient.releaseHold(offer.getId(), listing.getOwnerId());
            } catch (RuntimeException e) {
                paymentFailed = true;
                paymentFailureReason = "release_failed";
            }
        }

        offer.setStatus(OfferStatus.ACCEPTED);
        listingOfferRepository.save(offer);
        notificationsServiceClient.notify(offer.getRequesterId(), NotificationType.RENTAL_OFFER_ACCEPTED,
                "Your offer was accepted!",
                "Your offer on \"" + listing.getTitle() + "\" was accepted.",
                listing.getId());
        if (offer.getOfferType() == OfferType.CASH && !paymentFailed) {
            BigDecimal amount = listing.getDailyRate().multiply(BigDecimal.valueOf(offer.getDurationDays()));
            notificationsServiceClient.notify(listing.getOwnerId(), NotificationType.RENTAL_PAYMENT_RECEIVED,
                    "You got paid!",
                    "You received GH₵" + amount + " for \"" + listing.getTitle() + "\"",
                    listing.getId());
        }

        // Same pattern as BidService.acceptBid: reject every other still-pending offer on this
        // listing, since accepting one arrangement closes the listing to everyone else. Any of
        // those that put up a cash hold get it refunded - don't let one refund failure block the
        // rest, the winning offer's release has already happened (or already failed) by now.
        for (ListingOffer other : listingOfferRepository.findByListingOrderByCreatedAtDesc(listing)) {
            if (!other.getId().equals(offer.getId()) && other.getStatus() == OfferStatus.PENDING) {
                other.setStatus(OfferStatus.REJECTED);
                listingOfferRepository.save(other);
                if (other.getOfferType() == OfferType.CASH) {
                    try {
                        paymentsServiceClient.refundHold(other.getId());
                    } catch (RuntimeException e) {
                        // Log-and-continue: don't let a single stuck hold block the rest of the auto-rejects.
                    }
                }
                notificationsServiceClient.notify(other.getRequesterId(), NotificationType.RENTAL_OFFER_REJECTED,
                        "Your offer wasn't selected",
                        "Your offer on \"" + listing.getTitle() + "\" wasn't selected.",
                        listing.getId());
            }
        }

        listing.setStatus(ListingStatus.CLOSED);
        listingRepository.save(listing);

        UserSummaryResponse requester = resolveRequiredSummary(offer.getRequesterId());
        ListingOfferResponse offerResponse = ListingOfferResponse.from(offer, requester);
        return new OfferAcceptResponse(offerResponse, paymentFailed, paymentFailureReason);
    }

    @Transactional
    public ListingOfferResponse rejectOffer(UUID offerId, UUID currentUserId) {
        ListingOffer offer = findOfferOrThrow(offerId);
        listingService.requireOwner(offer.getListing(), currentUserId);
        if (offer.getStatus() != OfferStatus.PENDING) {
            throw new InvalidRequestException("Only pending offers can be rejected");
        }
        if (offer.getOfferType() == OfferType.CASH) {
            paymentsServiceClient.refundHold(offer.getId());
        }
        offer.setStatus(OfferStatus.REJECTED);
        ListingOffer saved = listingOfferRepository.save(offer);
        notificationsServiceClient.notify(offer.getRequesterId(), NotificationType.RENTAL_OFFER_REJECTED,
                "Your offer was rejected",
                "Your offer on \"" + offer.getListing().getTitle() + "\" was rejected.",
                offer.getListing().getId());
        UserSummaryResponse requester = resolveRequiredSummary(saved.getRequesterId());
        return ListingOfferResponse.from(saved, requester);
    }

    @Transactional
    public ListingOfferResponse withdrawOffer(UUID offerId, UUID currentUserId) {
        ListingOffer offer = findOfferOrThrow(offerId);
        if (!offer.getRequesterId().equals(currentUserId)) {
            throw new ForbiddenActionException("You can only withdraw your own offer");
        }
        if (offer.getStatus() != OfferStatus.PENDING) {
            throw new InvalidRequestException("Only pending offers can be withdrawn");
        }
        if (offer.getOfferType() == OfferType.CASH) {
            paymentsServiceClient.refundHold(offer.getId());
        }
        offer.setStatus(OfferStatus.WITHDRAWN);
        ListingOffer saved = listingOfferRepository.save(offer);
        UserSummaryResponse requester = resolveRequiredSummary(saved.getRequesterId());
        notificationsServiceClient.notify(offer.getListing().getOwnerId(), NotificationType.RENTAL_OFFER_WITHDRAWN,
                "An offer was withdrawn",
                requester.fullName() + " withdrew their offer on \"" + offer.getListing().getTitle() + "\"",
                offer.getListing().getId());
        return ListingOfferResponse.from(saved, requester);
    }

    private ListingOffer findOfferOrThrow(UUID id) {
        return listingOfferRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Offer not found"));
    }

    private UserSummaryResponse resolveRequiredSummary(UUID userId) {
        return userServiceClient.getSummary(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private Map<UUID, UserSummaryResponse> resolveSummaries(List<ListingOffer> offers) {
        Set<UUID> ids = new HashSet<>();
        for (ListingOffer offer : offers) {
            ids.add(offer.getRequesterId());
        }
        return userServiceClient.getSummaries(ids).stream()
                .collect(Collectors.toMap(UserSummaryResponse::id, s -> s));
    }
}
