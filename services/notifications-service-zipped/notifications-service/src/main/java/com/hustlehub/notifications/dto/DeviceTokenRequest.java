package com.hustlehub.notifications.dto;

import jakarta.validation.constraints.NotBlank;

public record DeviceTokenRequest(
        @NotBlank(message = "expoPushToken is required")
        String expoPushToken
) {
}
