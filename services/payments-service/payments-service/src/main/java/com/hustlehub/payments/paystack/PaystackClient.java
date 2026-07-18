package com.hustlehub.payments.paystack;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.hustlehub.payments.config.PaystackProperties;
import com.hustlehub.common.exception.UpstreamServiceException;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Thin wrapper around the slice of Paystack's REST API this service needs (initialize/verify a
 * charge, create a mobile money transfer recipient, initiate a transfer).
 * <p>
 * <b>UNVERIFIED AGAINST A LIVE PAYSTACK ACCOUNT.</b> Built from Paystack's documented API shape
 * from training knowledge only — no API key was available in this environment to make a single
 * real call. If a call fails once a real test secret key is configured, check in this order:
 * <ol>
 *     <li>The response field names/nesting in {@link PaystackInitializeData},
 *         {@link PaystackVerifyData}, {@link PaystackRecipientData}, {@link PaystackTransferData}
 *         against <a href="https://paystack.com/docs/api/">paystack.com/docs/api</a> — these are
 *         my best recollection of the {@code data} object's shape for each endpoint, not
 *         confirmed against a live response.</li>
 *     <li>Whether {@code amount} needs to be an integer or a numeric string — Paystack's docs
 *         have shown both at different times for different endpoints; this client sends it as a
 *         JSON integer (pesewas).</li>
 *     <li>The Ghana mobile money network -&gt; {@code bank_code} mapping in
 *         {@link GhanaMomoBankCodes} — flagged separately there, it's the one part of this most
 *         likely to be stale.</li>
 * </ol>
 * The secret key is read fresh from {@link PaystackProperties} on every call and is never logged
 * or included in any exception message thrown from here.
 */
@Component
public class PaystackClient {

    private final RestClient restClient;
    private final PaystackProperties properties;

    // RestClient.create(baseUrl) rather than an injected Builder - Boot 4.1 doesn't autoconfigure
    // a Builder bean out of the box (bit this project once already, see UserServiceClientImpl).
    public PaystackClient(PaystackProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.create(properties.getBaseUrl());
    }

    public PaystackInitializeData initializeTransaction(String email, long amountPesewas, String reference, String callbackUrl) {
        requireSecretKey();
        String normalizedCallbackUrl = (callbackUrl == null || callbackUrl.isBlank()) ? null : callbackUrl;
        InitializeRequest body = new InitializeRequest(email, amountPesewas, reference, normalizedCallbackUrl);
        try {
            PaystackEnvelope<PaystackInitializeData> response = restClient.post()
                    .uri("/transaction/initialize")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getSecretKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<PaystackEnvelope<PaystackInitializeData>>() { });
            return unwrap(response, "/transaction/initialize");
        } catch (RestClientResponseException e) {
            throw new UpstreamServiceException("Paystack transaction/initialize failed: " + e.getStatusCode() + " " + e.getResponseBodyAsString());
        } catch (RestClientException e) {
            throw new UpstreamServiceException("Could not reach Paystack to initialize transaction: " + e.getMessage());
        }
    }

    public PaystackVerifyData verifyTransaction(String reference) {
        requireSecretKey();
        try {
            PaystackEnvelope<PaystackVerifyData> response = restClient.get()
                    .uri("/transaction/verify/{reference}", reference)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getSecretKey())
                    .retrieve()
                    .body(new ParameterizedTypeReference<PaystackEnvelope<PaystackVerifyData>>() { });
            return unwrap(response, "/transaction/verify");
        } catch (RestClientResponseException e) {
            throw new UpstreamServiceException("Paystack transaction/verify failed: " + e.getStatusCode() + " " + e.getResponseBodyAsString());
        } catch (RestClientException e) {
            throw new UpstreamServiceException("Could not reach Paystack to verify transaction: " + e.getMessage());
        }
    }

    public PaystackRecipientData createTransferRecipient(String name, String accountNumber, String bankCode) {
        requireSecretKey();
        RecipientRequest body = new RecipientRequest("mobile_money", name, accountNumber, bankCode, "GHS");
        try {
            PaystackEnvelope<PaystackRecipientData> response = restClient.post()
                    .uri("/transferrecipient")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getSecretKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<PaystackEnvelope<PaystackRecipientData>>() { });
            return unwrap(response, "/transferrecipient");
        } catch (RestClientResponseException e) {
            throw new UpstreamServiceException("Paystack transferrecipient failed: " + e.getStatusCode() + " " + e.getResponseBodyAsString());
        } catch (RestClientException e) {
            throw new UpstreamServiceException("Could not reach Paystack to create a transfer recipient: " + e.getMessage());
        }
    }

    public PaystackTransferData initiateTransfer(long amountPesewas, String recipientCode, String reference, String reason) {
        requireSecretKey();
        TransferRequestBody body = new TransferRequestBody("balance", amountPesewas, recipientCode, reason, reference);
        try {
            PaystackEnvelope<PaystackTransferData> response = restClient.post()
                    .uri("/transfer")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getSecretKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<PaystackEnvelope<PaystackTransferData>>() { });
            return unwrap(response, "/transfer");
        } catch (RestClientResponseException e) {
            throw new UpstreamServiceException("Paystack transfer failed: " + e.getStatusCode() + " " + e.getResponseBodyAsString());
        } catch (RestClientException e) {
            throw new UpstreamServiceException("Could not reach Paystack to initiate a transfer: " + e.getMessage());
        }
    }

    private void requireSecretKey() {
        String secretKey = properties.getSecretKey();
        if (secretKey == null || secretKey.isBlank()) {
            throw new UpstreamServiceException(
                    "Paystack is not configured: app.paystack.secret-key (PAYSTACK_SECRET_KEY) is blank. "
                            + "Set it to a real Paystack test secret key to use topup/withdrawal.");
        }
    }

    private <T> T unwrap(PaystackEnvelope<T> envelope, String endpoint) {
        if (envelope == null || !envelope.status() || envelope.data() == null) {
            String message = envelope != null ? envelope.message() : "empty response body";
            throw new UpstreamServiceException("Paystack " + endpoint + " reported failure: " + message);
        }
        return envelope.data();
    }

    // --- Request bodies (outgoing) — Paystack expects snake_case JSON, so every non-camelCase
    // field is explicitly named via @JsonProperty rather than relying on a naming strategy. ---

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record InitializeRequest(String email, long amount, String reference,
                                      @JsonProperty("callback_url") String callbackUrl) {
    }

    private record RecipientRequest(String type, String name,
                                     @JsonProperty("account_number") String accountNumber,
                                     @JsonProperty("bank_code") String bankCode,
                                     String currency) {
    }

    private record TransferRequestBody(String source, long amount, String recipient, String reason, String reference) {
    }

    // --- Response shapes (incoming) — every Paystack response is {status, message, data}. ---

    public record PaystackEnvelope<T>(boolean status, String message, T data) {
    }

    public record PaystackInitializeData(@JsonProperty("authorization_url") String authorizationUrl,
                                          @JsonProperty("access_code") String accessCode,
                                          String reference) {
    }

    public record PaystackVerifyData(String reference, String status, Long amount) {
    }

    public record PaystackRecipientData(@JsonProperty("recipient_code") String recipientCode) {
    }

    public record PaystackTransferData(@JsonProperty("transfer_code") String transferCode,
                                        String reference, String status) {
    }
}
