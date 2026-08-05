package com.hustlehub.common.client;

import com.hustlehub.common.config.InternalApiProperties;
import com.hustlehub.common.config.RentalsServiceProperties;
import com.hustlehub.common.dto.CompletedEngagementResponse;
import com.hustlehub.common.dto.EngagementParticipantsResponse;
import com.hustlehub.common.exception.UpstreamServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class RentalsServiceClientImpl implements RentalsServiceClient {

    private static final Logger log = LoggerFactory.getLogger(RentalsServiceClientImpl.class);

    private final RestClient restClient;
    private final InternalApiProperties internalApiProperties;

    public RentalsServiceClientImpl(RentalsServiceProperties rentalsServiceProperties, InternalApiProperties internalApiProperties) {
        this.restClient = RestClient.create(rentalsServiceProperties.getUrl());
        this.internalApiProperties = internalApiProperties;
    }

    @Override
    public List<CompletedEngagementResponse> getAcceptedEngagements(UUID userId) {
        try {
            List<CompletedEngagementResponse> response = restClient.get()
                    .uri("/internal/listings/accepted-engagements/{userId}", userId)
                    .header(InternalApiProperties.HEADER_NAME, internalApiProperties.getKey())
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<CompletedEngagementResponse>>() { });
            return response != null ? response : List.of();
        } catch (RestClientException e) {
            log.warn("Failed to resolve accepted rental engagements for user {}: {}", userId, e.getMessage());
            return List.of();
        }
    }

    @Override
    public Optional<EngagementParticipantsResponse> getParticipants(UUID offerId) {
        try {
            EngagementParticipantsResponse response = restClient.get()
                    .uri("/internal/listings/offers/{id}/participants", offerId)
                    .header(InternalApiProperties.HEADER_NAME, internalApiProperties.getKey())
                    .retrieve()
                    .body(EngagementParticipantsResponse.class);
            return Optional.ofNullable(response);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                return Optional.empty();
            }
            throw new UpstreamServiceException("rentals-service returned " + e.getStatusCode() + " resolving offer " + offerId);
        } catch (RestClientException e) {
            throw new UpstreamServiceException("Could not reach rentals-service: " + e.getMessage());
        }
    }

    @Override
    public void suspendCleanup(UUID ownerId) {
        try {
            restClient.post()
                    .uri("/internal/listings/suspend-cleanup/{userId}", ownerId)
                    .header(InternalApiProperties.HEADER_NAME, internalApiProperties.getKey())
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Failed to run listing suspend-cleanup for user {}: {}", ownerId, e.getMessage());
        }
    }
}
