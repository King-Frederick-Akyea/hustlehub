package com.hustlehub.identity.dto.request;

import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * All fields are optional — only non-null fields are applied. {@code @Size} constraints only
 * evaluate when a value is present, so a null field never fails validation. {@code specializations}
 * is the exception: a non-null value always fully replaces the existing set (there's no partial
 * add/remove semantics), so an empty list is how a client clears it.
 */
public record UpdateProfileRequest(
        @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
        String fullName,

        @Size(max = 280, message = "Bio must be at most 280 characters")
        String bio,

        @Size(max = 20, message = "Phone number must be at most 20 characters")
        String phoneNumber,

        @Size(max = 200, message = "Availability must be at most 200 characters")
        String availability,

        List<String> specializations
) {
}
