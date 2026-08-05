package com.hustlehub.identity.service;

import com.hustlehub.common.client.NotificationsServiceClient;
import com.hustlehub.common.client.RentalsServiceClient;
import com.hustlehub.common.client.TasksServiceClient;
import com.hustlehub.common.dto.NotificationType;
import com.hustlehub.common.exception.InvalidRequestException;
import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.identity.dto.response.UserResponse;
import com.hustlehub.identity.entity.AccountStatus;
import com.hustlehub.identity.entity.User;
import com.hustlehub.identity.entity.VerificationDocument;
import com.hustlehub.identity.entity.VerificationDocumentType;
import com.hustlehub.identity.repository.UserRepository;
import com.hustlehub.identity.repository.VerificationDocumentRepository;
import com.hustlehub.identity.service.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Everything reachable only from the admin panel (hustlehubwebsite) — role-gated in AdminUserController, not here. */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final VerificationDocumentRepository verificationDocumentRepository;
    private final FileStorageService fileStorageService;
    private final UserService userService;
    private final TasksServiceClient tasksServiceClient;
    private final RentalsServiceClient rentalsServiceClient;
    private final NotificationsServiceClient notificationsServiceClient;

    public List<UserResponse> listUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream().map(userService::toResponse).toList();
    }

    public UserResponse getUser(UUID id) {
        return userService.toResponse(findOrThrow(id));
    }

    public DocumentData getDocument(UUID userId, String type) {
        User user = findOrThrow(userId);
        VerificationDocumentType docType;
        try {
            docType = VerificationDocumentType.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidRequestException("Unknown document type: " + type);
        }
        VerificationDocument document = verificationDocumentRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(user, docType)
                .orElseThrow(() -> new ResourceNotFoundException("This user hasn't uploaded a " + type + " document"));
        return new DocumentData(fileStorageService.read(document.getStoragePath()), document.getContentType());
    }

    @Transactional
    public UserResponse verify(UUID userId) {
        User user = findOrThrow(userId);
        user.setAdminVerified(true);
        user.setAdminVerifiedAt(Instant.now());
        userRepository.save(user);
        notificationsServiceClient.notify(userId, NotificationType.ACCOUNT_VERIFIED,
                "You're verified!", "HustleHub has verified your account — look for the badge on your profile.", null);
        return userService.toResponse(user);
    }

    @Transactional
    public UserResponse unverify(UUID userId) {
        User user = findOrThrow(userId);
        user.setAdminVerified(false);
        user.setAdminVerifiedAt(null);
        userRepository.save(user);
        return userService.toResponse(user);
    }

    /**
     * Suspends the account (blocks login/refresh — see AuthService) and, best-effort, pulls this
     * user's open tasks and active listings out of public browse feeds. The account lockout
     * itself always takes effect even if the tasks-service/rentals-service cleanup calls fail
     * (they never throw — see TasksServiceClient/RentalsServiceClient.suspendCleanup), since
     * that's the primary safety action here.
     */
    @Transactional
    public UserResponse suspend(UUID userId, String reason) {
        User user = findOrThrow(userId);
        user.setAccountStatus(AccountStatus.SUSPENDED);
        user.setSuspensionReason(reason);
        user.setSuspendedAt(Instant.now());
        userRepository.save(user);

        tasksServiceClient.suspendCleanup(userId);
        rentalsServiceClient.suspendCleanup(userId);

        notificationsServiceClient.notify(userId, NotificationType.ACCOUNT_SUSPENDED,
                "Your account has been suspended", reason, null);
        return userService.toResponse(user);
    }

    @Transactional
    public UserResponse unsuspend(UUID userId) {
        User user = findOrThrow(userId);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setSuspensionReason(null);
        user.setSuspendedAt(null);
        userRepository.save(user);
        return userService.toResponse(user);
    }

    private User findOrThrow(UUID id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public record DocumentData(byte[] data, String contentType) {
    }
}
