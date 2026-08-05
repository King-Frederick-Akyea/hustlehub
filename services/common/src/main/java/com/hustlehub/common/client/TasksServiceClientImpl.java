package com.hustlehub.common.client;

import com.hustlehub.common.config.InternalApiProperties;
import com.hustlehub.common.config.TasksServiceProperties;
import com.hustlehub.common.dto.CompletedEngagementResponse;
import com.hustlehub.common.dto.EngagementParticipantsResponse;
import com.hustlehub.common.dto.UserStatsResponse;
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
public class TasksServiceClientImpl implements TasksServiceClient {

    private static final Logger log = LoggerFactory.getLogger(TasksServiceClientImpl.class);

    private final RestClient restClient;
    private final InternalApiProperties internalApiProperties;

    public TasksServiceClientImpl(TasksServiceProperties tasksServiceProperties, InternalApiProperties internalApiProperties) {
        this.restClient = RestClient.create(tasksServiceProperties.getUrl());
        this.internalApiProperties = internalApiProperties;
    }

    @Override
    public Optional<UserStatsResponse> getStats(UUID userId) {
        try {
            UserStatsResponse response = restClient.get()
                    .uri("/internal/tasks/stats/{userId}", userId)
                    .header(InternalApiProperties.HEADER_NAME, internalApiProperties.getKey())
                    .retrieve()
                    .body(UserStatsResponse.class);
            return Optional.ofNullable(response);
        } catch (RestClientException e) {
            log.warn("Failed to resolve task stats for user {}: {}", userId, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public List<CompletedEngagementResponse> getCompletedEngagements(UUID userId) {
        try {
            List<CompletedEngagementResponse> response = restClient.get()
                    .uri("/internal/tasks/completed-engagements/{userId}", userId)
                    .header(InternalApiProperties.HEADER_NAME, internalApiProperties.getKey())
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<CompletedEngagementResponse>>() { });
            return response != null ? response : List.of();
        } catch (RestClientException e) {
            log.warn("Failed to resolve completed task engagements for user {}: {}", userId, e.getMessage());
            return List.of();
        }
    }

    @Override
    public Optional<EngagementParticipantsResponse> getParticipants(UUID taskId) {
        try {
            EngagementParticipantsResponse response = restClient.get()
                    .uri("/internal/tasks/{id}/participants", taskId)
                    .header(InternalApiProperties.HEADER_NAME, internalApiProperties.getKey())
                    .retrieve()
                    .body(EngagementParticipantsResponse.class);
            return Optional.ofNullable(response);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                return Optional.empty();
            }
            throw new UpstreamServiceException("tasks-service returned " + e.getStatusCode() + " resolving task " + taskId);
        } catch (RestClientException e) {
            throw new UpstreamServiceException("Could not reach tasks-service: " + e.getMessage());
        }
    }

    @Override
    public void suspendCleanup(UUID posterId) {
        try {
            restClient.post()
                    .uri("/internal/tasks/suspend-cleanup/{userId}", posterId)
                    .header(InternalApiProperties.HEADER_NAME, internalApiProperties.getKey())
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Failed to run task suspend-cleanup for user {}: {}", posterId, e.getMessage());
        }
    }
}
