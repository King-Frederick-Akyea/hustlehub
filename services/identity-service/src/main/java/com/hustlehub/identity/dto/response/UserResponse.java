package com.hustlehub.identity.dto.response;

import com.hustlehub.identity.entity.User;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** The caller's own profile ({@code GET /api/users/me}) — includes private fields (email, earnings,
 * suspension reason) that a public viewer of someone else's profile never sees; see {@link PublicProfileResponse}. */
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
        double averageRating,
        long reviewCount,
        boolean adminVerified,
        String accountStatus,
        String suspensionReason,
        String phoneNumber,
        String availability,
        List<String> specializations,
        Instant createdAt
) {
    /**
     * @param completedTasksCount count of tasks completed by this user as the assigned tasker
     * @param totalEarnings       sum of finalPrice across those completed tasks (never null — pass
     *                            {@link BigDecimal#ZERO} if the caller has no stats available)
     */
    public static UserResponse from(User user, long completedTasksCount, BigDecimal totalEarnings,
                                     double averageRating, long reviewCount) {
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
                averageRating,
                reviewCount,
                user.isAdminVerified(),
                user.getAccountStatus().toJson(),
                user.getSuspensionReason(),
                user.getPhoneNumber(),
                user.getAvailability(),
                user.getSpecializations().stream().sorted().toList(),
                user.getCreatedAt()
        );
    }
}
