package com.hustlehub.rentals.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Type-specific requirements (e.g. RENTAL needs a rate or barter, BARTER needs offering+seeking)
 * are enforced in {@code ListingService} rather than here, since they depend on the value of
 * {@code type} itself.
 */
public record CreateListingRequest(
        @NotBlank(message = "Type is required")
        @Pattern(regexp = "rental|barter", message = "Type must be 'rental' or 'barter'")
        String type,

        @NotBlank(message = "Title is required")
        @Size(min = 2, max = 150, message = "Title must be between 2 and 150 characters")
        String title,

        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description,

        @DecimalMin(value = "0.01", message = "Daily rate must be greater than 0")
        BigDecimal dailyRate,

        // Nullable Boolean, not a primitive boolean: Jackson 3.x's default
        // FAIL_ON_NULL_FOR_PRIMITIVES rejects the whole request with a 500 if a client omits this
        // optional field entirely (confirmed by an end-to-end request without it). ListingService
        // treats a null the same as false.
        Boolean barterAccepted,

        @Size(max = 255, message = "Offering must be at most 255 characters")
        String offering,

        @Size(max = 255, message = "Seeking must be at most 255 characters")
        String seeking
) {
}
