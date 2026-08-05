package com.hustlehub.reviews.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateReviewRequest(
        @NotNull(message = "revieweeId is required")
        UUID revieweeId,

        @NotBlank(message = "relatedType is required")
        @Pattern(regexp = "task|rental_offer", message = "relatedType must be 'task' or 'rental_offer'")
        String relatedType,

        @NotNull(message = "relatedId is required")
        UUID relatedId,

        @Min(value = 1, message = "Rating must be between 1 and 5")
        @Max(value = 5, message = "Rating must be between 1 and 5")
        int rating,

        @Size(max = 1000, message = "Comment must be at most 1000 characters")
        String comment
) {
}
