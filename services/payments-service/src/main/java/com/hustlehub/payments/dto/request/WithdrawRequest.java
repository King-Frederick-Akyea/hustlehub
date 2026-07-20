package com.hustlehub.payments.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record WithdrawRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        BigDecimal amount,

        @NotBlank(message = "Mobile money number is required")
        String mobileMoneyNumber,

        /** Ghana mobile money network, e.g. "MTN", "VODAFONE", "AIRTELTIGO" — see GhanaMomoBankCodes. */
        @NotBlank(message = "Mobile money provider is required")
        String provider
) {
}
