package com.hustlehub.tasks.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateTaskRequest(
        @NotBlank(message = "Title is required")
        @Size(min = 2, max = 150, message = "Title must be between 2 and 150 characters")
        String title,

        @NotBlank(message = "Description is required")
        @Size(min = 10, max = 2000, message = "Description must be at least 10 characters")
        String description,

        @NotBlank(message = "Category is required")
        @Pattern(regexp = "grocery|laundry|documents|queue|delivery|tutoring|cleaning|tech|moving|other",
                message = "Invalid category")
        String category,

        @NotNull(message = "Budget is required")
        @DecimalMin(value = "0.01", message = "Budget must be greater than 0")
        BigDecimal budget,

        @NotBlank(message = "Location is required")
        String location,

        Double locationLat,
        Double locationLng,

        boolean isDelivery,
        String pickupLocation,
        Double pickupLat,
        Double pickupLng,
        String dropoffLocation,
        Double dropoffLat,
        Double dropoffLng,

        @NotNull(message = "Deadline is required")
        Instant deadline,

        boolean isUrgent
) {
}
