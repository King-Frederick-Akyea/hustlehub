package com.hustlehub.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SuspendUserRequest(
        @NotBlank(message = "A reason is required")
        @Size(max = 1000, message = "Reason must be at most 1000 characters")
        String reason
) {
}
