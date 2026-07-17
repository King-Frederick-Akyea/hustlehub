package com.hustlehub.tasks.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PlaceBidRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        BigDecimal amount,

        @Size(max = 500, message = "Message must be at most 500 characters")
        String message,

        @Size(max = 100, message = "Delivery time must be at most 100 characters")
        String deliveryTime
) {
}
