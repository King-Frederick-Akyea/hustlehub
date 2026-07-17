package com.hustlehub.common.client;

import com.hustlehub.common.config.InternalApiProperties;
import com.hustlehub.common.config.PaymentsServiceProperties;
import com.hustlehub.common.dto.EscrowAdjustRequest;
import com.hustlehub.common.dto.EscrowHoldRequest;
import com.hustlehub.common.dto.EscrowReleaseRequest;
import com.hustlehub.common.dto.EscrowRefundRequest;
import com.hustlehub.common.dto.TransferResult;
import com.hustlehub.common.exception.UpstreamServiceException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class PaymentsServiceClientImpl implements PaymentsServiceClient {

    private final RestClient restClient;
    private final InternalApiProperties internalApiProperties;

    // RestClient.create(baseUrl) rather than an injected RestClient.Builder - Boot 4.1 doesn't
    // autoconfigure a Builder bean out of the box (bit this project once already).
    public PaymentsServiceClientImpl(PaymentsServiceProperties paymentsServiceProperties, InternalApiProperties internalApiProperties) {
        this.restClient = RestClient.create(paymentsServiceProperties.getUrl());
        this.internalApiProperties = internalApiProperties;
    }

    @Override
    public TransferResult hold(UUID payerId, BigDecimal amount, String entityType, UUID relatedEntityId, String description) {
        return postForResult("/internal/payments/escrow/hold",
                new EscrowHoldRequest(payerId, amount, entityType, relatedEntityId, description));
    }

    @Override
    public TransferResult adjustHold(UUID relatedEntityId, BigDecimal newAmount) {
        return postForResult("/internal/payments/escrow/adjust", new EscrowAdjustRequest(relatedEntityId, newAmount));
    }

    @Override
    public void releaseHold(UUID relatedEntityId, UUID beneficiaryId) {
        postExpectingSuccess("/internal/payments/escrow/release", new EscrowReleaseRequest(relatedEntityId, beneficiaryId));
    }

    @Override
    public void refundHold(UUID relatedEntityId) {
        postExpectingSuccess("/internal/payments/escrow/refund", new EscrowRefundRequest(relatedEntityId));
    }

    private TransferResult postForResult(String path, Object body) {
        try {
            TransferResult result = restClient.post()
                    .uri(path)
                    .header(InternalApiProperties.HEADER_NAME, internalApiProperties.getKey())
                    .body(body)
                    .retrieve()
                    .body(TransferResult.class);
            return result != null ? result : TransferResult.failure("empty_response");
        } catch (RestClientException e) {
            throw new UpstreamServiceException("Could not reach payments-service: " + e.getMessage());
        }
    }

    /** For release/refund - by design these have no soft-failure outcome, so any problem is exceptional. */
    private void postExpectingSuccess(String path, Object body) {
        try {
            restClient.post()
                    .uri(path)
                    .header(InternalApiProperties.HEADER_NAME, internalApiProperties.getKey())
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            throw new UpstreamServiceException("payments-service could not settle escrow " + path + ": " + e.getMessage());
        }
    }
}
