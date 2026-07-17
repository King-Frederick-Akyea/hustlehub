package com.hustlehub.tasks.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PostStatusUpdateRequest(
        @NotBlank(message = "Note is required")
        @Size(max = 500, message = "Note must be at most 500 characters")
        String note
) {
}
