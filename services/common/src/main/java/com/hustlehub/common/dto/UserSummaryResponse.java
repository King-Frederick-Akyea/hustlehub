package com.hustlehub.common.dto;

import java.util.UUID;

/**
 * Public-safe, lightweight view of a user for embedding in other services' responses (task
 * poster/assigned tasker, bid author, chat participant) — never includes email or anything
 * private. Only identity-service can build one from a real {@code User} entity; every other
 * service gets these from {@link com.hustlehub.common.client.UserServiceClient}.
 */
public record UserSummaryResponse(
        UUID id,
        String fullName,
        String avatarUrl,
        boolean verified
) {
}
