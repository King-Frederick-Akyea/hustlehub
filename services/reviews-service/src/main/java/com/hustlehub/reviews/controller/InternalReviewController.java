package com.hustlehub.reviews.controller;

import com.hustlehub.common.config.InternalApiProperties;
import com.hustlehub.common.dto.ReviewStatsResponse;
import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.reviews.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Resolves review stats for other services (via {@code common}'s {@code ReviewsServiceClient}).
 * Not reachable by end users — protected by a shared internal key instead of a user JWT, checked
 * here (see SecurityConfig, which permits /internal/** without authentication).
 */
@RestController
@RequestMapping("/internal/reviews")
@RequiredArgsConstructor
public class InternalReviewController {

    private final ReviewService reviewService;
    private final InternalApiProperties internalApiProperties;

    @GetMapping("/stats/{userId}")
    public ReviewStatsResponse getStats(@PathVariable UUID userId,
                                         @RequestHeader(value = InternalApiProperties.HEADER_NAME, required = false) String key) {
        requireInternalKey(key);
        return reviewService.getStats(userId);
    }

    private void requireInternalKey(String provided) {
        if (provided == null || !internalApiProperties.getKey().equals(provided)) {
            throw new ForbiddenActionException("Invalid internal API key");
        }
    }
}
