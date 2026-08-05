package com.hustlehub.identity.service;

import com.hustlehub.common.client.ReviewsServiceClient;
import com.hustlehub.common.client.TasksServiceClient;
import com.hustlehub.common.dto.ReviewStatsResponse;
import com.hustlehub.common.dto.UserStatsResponse;
import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.identity.dto.request.UpdateProfileRequest;
import com.hustlehub.identity.dto.response.PublicProfileResponse;
import com.hustlehub.identity.dto.response.UserResponse;
import com.hustlehub.identity.entity.User;
import com.hustlehub.identity.repository.UserRepository;
import com.hustlehub.identity.service.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.UUID;

/**
 * Assembles {@link UserResponse}/{@link PublicProfileResponse} and owns profile-mutation logic.
 * Completed-tasks/earnings and rating stats are resolved live from tasks-service/reviews-service
 * via their respective clients on every call — both clients degrade to zero/empty on failure
 * (see their Impls), so a hiccup in either service never breaks profile viewing entirely.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final TasksServiceClient tasksServiceClient;
    private final ReviewsServiceClient reviewsServiceClient;

    public UserResponse toResponse(User user) {
        UserStatsResponse taskStats = tasksServiceClient.getStats(user.getId())
                .orElse(new UserStatsResponse(0L, BigDecimal.ZERO));
        ReviewStatsResponse reviewStats = reviewsServiceClient.getStats(user.getId());
        return UserResponse.from(user, taskStats.completedTasksCount(), taskStats.totalEarnings(),
                reviewStats.averageRating(), reviewStats.reviewCount());
    }

    public UserResponse getCurrentUser(UUID userId) {
        return toResponse(findUserOrThrow(userId));
    }

    public PublicProfileResponse getPublicProfile(UUID userId) {
        User user = findUserOrThrow(userId);
        UserStatsResponse taskStats = tasksServiceClient.getStats(user.getId())
                .orElse(new UserStatsResponse(0L, BigDecimal.ZERO));
        ReviewStatsResponse reviewStats = reviewsServiceClient.getStats(user.getId());
        return PublicProfileResponse.from(user, taskStats.completedTasksCount(),
                reviewStats.averageRating(), reviewStats.reviewCount());
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = findUserOrThrow(userId);
        if (request.fullName() != null) {
            user.setFullName(request.fullName().trim());
        }
        if (request.bio() != null) {
            user.setBio(request.bio().trim());
        }
        if (request.phoneNumber() != null) {
            user.setPhoneNumber(request.phoneNumber().trim().isEmpty() ? null : request.phoneNumber().trim());
        }
        if (request.availability() != null) {
            user.setAvailability(request.availability().trim().isEmpty() ? null : request.availability().trim());
        }
        if (request.specializations() != null) {
            user.setSpecializations(new HashSet<>(request.specializations()));
        }
        userRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public UserResponse uploadAvatar(UUID userId, MultipartFile file) {
        User user = findUserOrThrow(userId);
        FileStorageService.StoredFile stored = fileStorageService.storeAvatar(user.getId(), file);
        user.setAvatarPath(stored.storagePath());
        userRepository.save(user);
        return toResponse(user);
    }

    private User findUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
