package com.hustlehub.identity.controller;

import com.hustlehub.common.config.InternalApiProperties;
import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.identity.entity.User;
import com.hustlehub.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Resolves user summaries for other services (via {@code common}'s {@code UserServiceClient}).
 * Not reachable by end users — protected by a shared internal key instead of a user JWT, checked
 * here in the controller (see SecurityConfig, which permits this path without authentication).
 * This is now the only place that used to be {@code UserSummaryResponse.from(User)} in the
 * monolith — {@code common}'s {@code UserSummaryResponse} has no {@code User} entity to build
 * itself from, since only identity-service has a users table.
 */
@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserRepository userRepository;
    private final InternalApiProperties internalApiProperties;

    @GetMapping("/{id}")
    public UserSummaryResponse getSummary(@PathVariable UUID id,
                                           @RequestHeader(value = InternalApiProperties.HEADER_NAME, required = false) String key) {
        requireInternalKey(key);
        User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toSummary(user);
    }

    @GetMapping("/batch")
    public List<UserSummaryResponse> getSummaries(@RequestParam String ids,
                                                    @RequestHeader(value = InternalApiProperties.HEADER_NAME, required = false) String key) {
        requireInternalKey(key);
        List<UUID> uuids = Arrays.stream(ids.split(",")).map(UUID::fromString).toList();
        return userRepository.findAllById(uuids).stream().map(this::toSummary).toList();
    }

    private void requireInternalKey(String provided) {
        // provided is null when the caller omits X-Internal-Key entirely (required = false above,
        // so a missing header doesn't 500 via MissingRequestHeaderException) — treated the same
        // as a wrong key, both are just "not authorized" from the caller's perspective.
        if (provided == null || !internalApiProperties.getKey().equals(provided)) {
            throw new ForbiddenActionException("Invalid internal API key");
        }
    }

    private UserSummaryResponse toSummary(User user) {
        String avatarUrl = user.getAvatarPath() != null ? "/api/users/" + user.getId() + "/avatar" : null;
        return new UserSummaryResponse(user.getId(), user.getFullName(), avatarUrl, user.isEmailVerified());
    }
}
