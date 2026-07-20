package com.hustlehub.rentals.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Type-specific requirements (CASH needs durationDays, BARTER needs a barterMessage, and each is
 * only valid against certain listing shapes) are enforced in {@code ListingOfferService} rather
 * than here, since they depend on both {@code offerType} and the target listing.
 */
public record MakeOfferRequest(
        @NotBlank(message = "Offer type is required")
        @Pattern(regexp = "cash|barter", message = "Offer type must be 'cash' or 'barter'")
        String offerType,

        @Min(value = 1, message = "Duration must be at least 1 day")
        Integer durationDays,

        @Size(max = 2000, message = "Barter message must be at most 2000 characters")
        String barterMessage
) {
}
