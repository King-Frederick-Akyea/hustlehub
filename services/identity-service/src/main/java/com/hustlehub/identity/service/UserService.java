package com.hustlehub.identity.service;

import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.identity.dto.request.UpdateProfileRequest;
import com.hustlehub.identity.dto.response.UserResponse;
import com.hustlehub.identity.entity.User;
import com.hustlehub.identity.repository.UserRepository;
import com.hustlehub.identity.service.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Assembles the {@link UserResponse} and owns profile-mutation logic (editing fullName/bio,
 * uploading an avatar).
 *
 * <p>Deviation from the monolith: {@code completedTasksCount}/{@code totalEarnings} used to be
 * computed here via a {@code TaskRepository} join. Tasks now live entirely in tasks-service, and
 * identity-service has no tasks table to query — those fields are always {@code 0}/{@link BigDecimal#ZERO}
 * here. Wiring real stats back in (via a tasks-service internal endpoint) is a follow-up, not
 * something this split can do on its own since tasks-service doesn't expose one yet.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public UserResponse toResponse(User user) {
        return UserResponse.from(user, 0L, BigDecimal.ZERO);
    }

    public UserResponse getCurrentUser(UUID userId) {
        return toResponse(findUserOrThrow(userId));
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
