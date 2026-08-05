package com.hustlehub.reviews.controller;

import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.reviews.dto.request.CreateReviewRequest;
import com.hustlehub.reviews.dto.response.EligibleEngagementResponse;
import com.hustlehub.reviews.dto.response.ReviewResponse;
import com.hustlehub.reviews.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/user/{userId}")
    public List<ReviewResponse> getReviewsForUser(@PathVariable UUID userId) {
        return reviewService.getReviewsForUser(userId);
    }

    @GetMapping("/eligible")
    public List<EligibleEngagementResponse> getEligible(@AuthenticationPrincipal AuthPrincipal principal) {
        return reviewService.getEligible(principal.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse createReview(@AuthenticationPrincipal AuthPrincipal principal,
                                        @Valid @RequestBody CreateReviewRequest request) {
        return reviewService.createReview(principal.id(), request);
    }
}
