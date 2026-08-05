package com.hustlehub.common.client;

import com.hustlehub.common.dto.CompletedEngagementResponse;
import com.hustlehub.common.dto.EngagementParticipantsResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Resolves rental/barter-derived facts from rentals-service for review eligibility. Rentals have
 * no explicit "completed" state, so an ACCEPTED offer is the eligibility bar here (see
 * {@link EngagementParticipantsResponse}).
 */
public interface RentalsServiceClient {

    /** Accepted listing offers this user was party to, for the "eligible to review" list. Empty list on failure. */
    List<CompletedEngagementResponse> getAcceptedEngagements(UUID userId);

    /** Server-side re-validation for a review write. Throws if rentals-service is unreachable. */
    Optional<EngagementParticipantsResponse> getParticipants(UUID offerId);

    /**
     * Closes every ACTIVE listing this user owns (rejecting/refunding any still-pending offers on
     * them), when an admin suspends them. Best-effort: never throws — see TasksServiceClient's
     * matching method for why.
     */
    void suspendCleanup(UUID ownerId);
}
