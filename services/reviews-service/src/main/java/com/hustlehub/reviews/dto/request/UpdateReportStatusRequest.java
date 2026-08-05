package com.hustlehub.reviews.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateReportStatusRequest(
        @NotBlank(message = "Status is required")
        String status,

        @Size(max = 2000, message = "Admin note must be at most 2000 characters")
        String adminNote
) {
}
