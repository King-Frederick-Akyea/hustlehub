package com.hustlehub.reviews.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateReportRequest(
        @NotNull(message = "reportedUserId is required")
        UUID reportedUserId,

        @NotBlank(message = "reasonCategory is required")
        String reasonCategory,

        @NotBlank(message = "Description is required")
        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description
) {
}
