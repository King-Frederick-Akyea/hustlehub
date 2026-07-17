package com.hustlehub.common.client;

import com.hustlehub.common.config.IdentityServiceProperties;
import com.hustlehub.common.config.InternalApiProperties;
import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.common.exception.UpstreamServiceException;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserServiceClientImpl implements UserServiceClient {

    private final RestClient restClient;
    private final InternalApiProperties internalApiProperties;

    // Built with RestClient.create(baseUrl) rather than an injected RestClient.Builder — Boot
    // 4.1 doesn't autoconfigure a Builder bean out of the box (bit this project once already).
    public UserServiceClientImpl(IdentityServiceProperties identityServiceProperties, InternalApiProperties internalApiProperties) {
        this.restClient = RestClient.create(identityServiceProperties.getUrl());
        this.internalApiProperties = internalApiProperties;
    }

    @Override
    public Optional<UserSummaryResponse> getSummary(UUID userId) {
        try {
            UserSummaryResponse response = restClient.get()
                    .uri("/internal/users/{id}", userId)
                    .header(InternalApiProperties.HEADER_NAME, internalApiProperties.getKey())
                    .retrieve()
                    .body(UserSummaryResponse.class);
            return Optional.ofNullable(response);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                return Optional.empty();
            }
            throw new UpstreamServiceException("identity-service returned " + e.getStatusCode() + " resolving user " + userId);
        } catch (RestClientException e) {
            throw new UpstreamServiceException("Could not reach identity-service: " + e.getMessage());
        }
    }

    @Override
    public List<UserSummaryResponse> getSummaries(Collection<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        String idsParam = userIds.stream().map(UUID::toString).collect(Collectors.joining(","));
        try {
            List<UserSummaryResponse> response = restClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/internal/users/batch").queryParam("ids", idsParam).build())
                    .header(InternalApiProperties.HEADER_NAME, internalApiProperties.getKey())
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<UserSummaryResponse>>() { });
            return response != null ? response : List.of();
        } catch (RestClientException e) {
            throw new UpstreamServiceException("Could not reach identity-service: " + e.getMessage());
        }
    }
}
