package com.hustlehub.identity.dto.request;

import jakarta.validation.constraints.Size;

/**
 * Both fields are optional — only non-null fields are applied. {@code @Size} constraints only
 * evaluate when a value is present, so a null field never fails validation.
 */
public record UpdateProfileRequest(
        @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
        String fullName,

        @Size(max = 280, message = "Bio must be at most 280 characters")
        String bio
) {
}
