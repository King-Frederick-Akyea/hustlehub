package com.hustlehub.tasks.dto.response;

import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.tasks.entity.Task;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TaskResponse(
        UUID id,
        String title,
        String description,
        String category,
        BigDecimal budget,
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
        Instant deadline,
        boolean isUrgent,
        String status,
        UserSummaryResponse poster,
        UserSummaryResponse assignedTasker,
        BigDecimal finalPrice,
        int bidCount,
        String myBidStatus,
        Instant createdAt,
        Instant completedAt
) {
    /**
     * Poster/assignedTasker are pre-resolved by the service layer via UserServiceClient — this
     * entity no longer has a JPA relation to load them from (no users table in this service).
     */
    public static TaskResponse from(Task task, long bidCount, String myBidStatus,
                                     UserSummaryResponse poster, UserSummaryResponse assignedTasker) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getCategory().toJson(),
                task.getBudget(),
                task.getLocation(),
                task.getLocationLat(),
                task.getLocationLng(),
                task.isDelivery(),
                task.getPickupLocation(),
                task.getPickupLat(),
                task.getPickupLng(),
                task.getDropoffLocation(),
                task.getDropoffLat(),
                task.getDropoffLng(),
                task.getDeadline(),
                task.isUrgent(),
                task.getStatus().toJson(),
                poster,
                assignedTasker,
                task.getFinalPrice(),
                (int) bidCount,
                myBidStatus,
                task.getCreatedAt(),
                task.getCompletedAt()
        );
    }
}
