package com.hustlehub.identity.dto.response;

import com.hustlehub.identity.entity.User;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String fullName,
        String email,
        String role,
        String verificationStatus,
        boolean emailVerified,
        String bio,
        String avatarUrl,
        int completedTasksCount,
        BigDecimal totalEarnings,
        Instant createdAt
) {
    /**
     * @param completedTasksCount count of tasks completed by this user as the assigned tasker
     * @param totalEarnings       sum of finalPrice across those completed tasks (never null — pass
     *                            {@link BigDecimal#ZERO} if the caller has no stats available)
     */
    public static UserResponse from(User user, long completedTasksCount, BigDecimal totalEarnings) {
        String avatarUrl = user.getAvatarPath() != null ? "/api/users/" + user.getId() + "/avatar" : null;
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().toJson(),
                user.getVerificationStatus().toJson(),
                user.isEmailVerified(),
                user.getBio(),
                avatarUrl,
                (int) completedTasksCount,
                totalEarnings != null ? totalEarnings : BigDecimal.ZERO,
                user.getCreatedAt()
        );
    }
}
