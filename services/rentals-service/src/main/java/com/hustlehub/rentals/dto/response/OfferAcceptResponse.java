package com.hustlehub.rentals.dto.response;

/**
 * Accepting a CASH offer triggers a real wallet transfer, so this endpoint's response needs a bit
 * more than the plain offer shape — {@code paymentFailed}/{@code paymentFailureReason} let the
 * frontend show "payment pending" instead of a hard error, since a failed transfer does not roll
 * back the accepted rental agreement (see ListingOfferService.acceptOffer). For BARTER offers
 * (no payment involved), paymentFailed is always false.
 */
public record OfferAcceptResponse(
        ListingOfferResponse offer,
        boolean paymentFailed,
        String paymentFailureReason
) {
}
