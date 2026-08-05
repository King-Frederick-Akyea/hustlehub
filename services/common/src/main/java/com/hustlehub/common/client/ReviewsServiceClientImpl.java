package com.hustlehub.common.client;

import com.hustlehub.common.config.InternalApiProperties;
import com.hustlehub.common.config.ReviewsServiceProperties;
import com.hustlehub.common.dto.ReviewStatsResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.UUID;

@Service
public class ReviewsServiceClientImpl implements ReviewsServiceClient {

    private static final Logger log = LoggerFactory.getLogger(ReviewsServiceClientImpl.class);

    private final RestClient restClient;
    private final InternalApiProperties internalApiProperties;

    public ReviewsServiceClientImpl(ReviewsServiceProperties reviewsServiceProperties, InternalApiProperties internalApiProperties) {
        this.restClient = RestClient.create(reviewsServiceProperties.getUrl());
        this.internalApiProperties = internalApiProperties;
    }

    @Override
    public ReviewStatsResponse getStats(UUID userId) {
        try {
            ReviewStatsResponse response = restClient.get()
                    .uri("/internal/reviews/stats/{userId}", userId)
                    .header(InternalApiProperties.HEADER_NAME, internalApiProperties.getKey())
                    .retrieve()
                    .body(ReviewStatsResponse.class);
            return response != null ? response : ReviewStatsResponse.empty();
        } catch (RestClientException e) {
            log.warn("Failed to resolve review stats for user {}: {}", userId, e.getMessage());
            return ReviewStatsResponse.empty();
        }
    }
}
