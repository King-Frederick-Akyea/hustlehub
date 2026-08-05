package com.hustlehub.reviews.service;

import com.hustlehub.common.client.NotificationsServiceClient;
import com.hustlehub.common.client.RentalsServiceClient;
import com.hustlehub.common.client.TasksServiceClient;
import com.hustlehub.common.client.UserServiceClient;
import com.hustlehub.common.dto.CompletedEngagementResponse;
import com.hustlehub.common.dto.EngagementParticipantsResponse;
import com.hustlehub.common.dto.NotificationType;
import com.hustlehub.common.dto.ReviewStatsResponse;
import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.common.exception.InvalidRequestException;
import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.reviews.dto.request.CreateReviewRequest;
import com.hustlehub.reviews.dto.response.EligibleEngagementResponse;
import com.hustlehub.reviews.dto.response.ReviewResponse;
import com.hustlehub.reviews.entity.EngagementType;
import com.hustlehub.reviews.entity.Review;
import com.hustlehub.reviews.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserServiceClient userServiceClient;
    private final TasksServiceClient tasksServiceClient;
    private final RentalsServiceClient rentalsServiceClient;
    private final NotificationsServiceClient notificationsServiceClient;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsForUser(UUID userId) {
        List<Review> reviews = reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(userId);
        if (reviews.isEmpty()) {
            return List.of();
        }
        Map<UUID, UserSummaryResponse> reviewers = resolveSummaries(
                reviews.stream().map(Review::getReviewerId).distinct().toList());
        return reviews.stream()
                .map(r -> ReviewResponse.from(r, reviewers.get(r.getReviewerId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public ReviewStatsResponse getStats(UUID userId) {
        long count = reviewRepository.countByRevieweeId(userId);
        double average = count > 0 ? reviewRepository.averageRatingFor(userId) : 0.0;
        return new ReviewStatsResponse(average, count);
    }

    /** Completed/accepted engagements the current user hasn't reviewed the other party for yet. */
    @Transactional(readOnly = true)
    public List<EligibleEngagementResponse> getEligible(UUID userId) {
        List<CompletedEngagementResponse> all = new ArrayList<>(tasksServiceClient.getCompletedEngagements(userId));
        all.addAll(rentalsServiceClient.getAcceptedEngagements(userId));

        List<CompletedEngagementResponse> unreviewed = all.stream()
                .filter(e -> !reviewRepository.existsByReviewerIdAndRelatedTypeAndRelatedId(
                        userId, EngagementType.valueOf(e.relatedType()), e.relatedId()))
                .toList();
        if (unreviewed.isEmpty()) {
            return List.of();
        }

        Map<UUID, UserSummaryResponse> otherParties = resolveSummaries(
                unreviewed.stream().map(CompletedEngagementResponse::otherPartyId).distinct().toList());

        return unreviewed.stream()
                .map(e -> new EligibleEngagementResponse(
                        e.relatedType().toLowerCase(),
                        e.relatedId(),
                        otherParties.get(e.otherPartyId()),
                        e.engagedAt()))
                .toList();
    }

    @Transactional
    public ReviewResponse createReview(UUID reviewerId, CreateReviewRequest request) {
        EngagementType relatedType = EngagementType.fromJson(request.relatedType());
        UUID relatedId = request.relatedId();

        // Eligibility is re-derived from the owning service, never trusted from the client - see
        // EngagementParticipantsResponse's javadoc.
        EngagementParticipantsResponse participants = switch (relatedType) {
            case TASK -> tasksServiceClient.getParticipants(relatedId)
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
            case RENTAL_OFFER -> rentalsServiceClient.getParticipants(relatedId)
                    .orElseThrow(() -> new ResourceNotFoundException("Offer not found"));
        };

        if (!participants.involves(reviewerId)) {
            throw new ForbiddenActionException("You weren't part of this engagement");
        }
        if (!participants.eligible()) {
            throw new ForbiddenActionException("This engagement isn't eligible for a review yet");
        }
        UUID actualOtherParty = participants.otherParty(reviewerId);
        if (!actualOtherParty.equals(request.revieweeId())) {
            throw new InvalidRequestException("revieweeId does not match the other party in this engagement");
        }
        if (reviewRepository.existsByReviewerIdAndRelatedTypeAndRelatedId(reviewerId, relatedType, relatedId)) {
            throw new InvalidRequestException("You already reviewed this engagement");
        }

        Review review = reviewRepository.save(Review.builder()
                .reviewerId(reviewerId)
                .revieweeId(request.revieweeId())
                .relatedType(relatedType)
                .relatedId(relatedId)
                .rating(request.rating())
                .comment(request.comment() != null ? request.comment().trim() : null)
                .build());

        UserSummaryResponse reviewer = userServiceClient.getSummary(reviewerId).orElse(null);

        String reviewerName = reviewer != null ? reviewer.fullName() : "Someone";
        notificationsServiceClient.notify(request.revieweeId(), NotificationType.REVIEW_RECEIVED,
                "New review", reviewerName + " left you a " + request.rating() + "-star review", review.getId());

        return ReviewResponse.from(review, reviewer);
    }

    private Map<UUID, UserSummaryResponse> resolveSummaries(List<UUID> userIds) {
        return userServiceClient.getSummaries(userIds).stream()
                .collect(Collectors.toMap(UserSummaryResponse::id, Function.identity()));
    }
}
