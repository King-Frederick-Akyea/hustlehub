package com.hustlehub.common.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * One completed (tasks-service: status COMPLETED) or accepted (rentals-service: offer status
 * ACCEPTED - rentals/barter have no explicit "completed" state) engagement between the caller and
 * another user, returned by {@code TasksServiceClient}/{@code RentalsServiceClient}. Used to
 * build the reviews-service "eligible to review" list - never trusted for anything else, since
 * eligibility is re-checked server-side via {@link EngagementParticipantsResponse} at review-write time.
 *
 * @param relatedType "TASK" or "RENTAL_OFFER"
 */
public record CompletedEngagementResponse(String relatedType, UUID relatedId, UUID otherPartyId, Instant engagedAt) {
}
