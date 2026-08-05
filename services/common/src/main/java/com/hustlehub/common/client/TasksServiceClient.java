package com.hustlehub.common.client;

import com.hustlehub.common.dto.CompletedEngagementResponse;
import com.hustlehub.common.dto.EngagementParticipantsResponse;
import com.hustlehub.common.dto.UserStatsResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Resolves task-derived facts from tasks-service: profile stats and review eligibility. */
public interface TasksServiceClient {

    /** Empty if tasks-service is unreachable or has nothing for this user - callers should default to zero, not fail the whole profile. */
    Optional<UserStatsResponse> getStats(UUID userId);

    /** Completed tasks (as poster or tasker) this user hasn't been reviewed for yet, for the "eligible to review" list. Empty list on failure. */
    List<CompletedEngagementResponse> getCompletedEngagements(UUID userId);

    /** Server-side re-validation for a review write. Throws if tasks-service is unreachable (correctness-critical, unlike the two methods above). */
    Optional<EngagementParticipantsResponse> getParticipants(UUID taskId);

    /**
     * Cancels (with escrow refund) every OPEN task this user posted, when an admin suspends them
     * - pulls their open posts out of the public browse feed without touching any task already
     * in progress with another user. Best-effort: never throws, so a tasks-service hiccup never
     * blocks the actual suspension (account lockout) from taking effect.
     */
    void suspendCleanup(UUID posterId);
}
