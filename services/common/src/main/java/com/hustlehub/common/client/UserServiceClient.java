package com.hustlehub.common.client;

import com.hustlehub.common.dto.UserSummaryResponse;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Resolves user summaries from identity-service. Used by every other service to embed
 * poster/tasker/author/participant info in their own responses without owning a users table.
 */
public interface UserServiceClient {

    Optional<UserSummaryResponse> getSummary(UUID userId);

    /** Batched to avoid N+1 calls when building a list response (e.g. 20 tasks -> 1 call, not 20). */
    List<UserSummaryResponse> getSummaries(Collection<UUID> userIds);
}
