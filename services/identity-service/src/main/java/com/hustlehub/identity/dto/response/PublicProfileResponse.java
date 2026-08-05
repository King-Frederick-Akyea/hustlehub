package com.hustlehub.identity.dto.response;

import com.hustlehub.identity.entity.User;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * What one user sees viewing another user's profile ({@code GET /api/users/{id}}) — no email, no
 * phone number, no earnings amount (privacy defaults: other users see completed-job count and
 * rating, not GH₵ earned or contact info — messaging is the sanctioned way to reach someone), no
 * suspension/account-status detail. See {@link UserResponse} for the owner's own view.
 */
public record PublicProfileResponse(
        UUID id,
        String fullName,
        String role,
        String bio,
        String avatarUrl,
        boolean adminVerified,
        int completedTasksCount,
        double averageRating,
        long reviewCount,
        String availability,
        List<String> specializations,
        Instant memberSince
) {
    public static PublicProfileResponse from(User user, long completedTasksCount, double averageRating, long reviewCount) {
        String avatarUrl = user.getAvatarPath() != null ? "/api/users/" + user.getId() + "/avatar" : null;
        return new PublicProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getRole().toJson(),
                user.getBio(),
                avatarUrl,
                user.isAdminVerified(),
                (int) completedTasksCount,
                averageRating,
                reviewCount,
                user.getAvailability(),
                user.getSpecializations().stream().sorted().toList(),
                user.getCreatedAt()
        );
    }
}
