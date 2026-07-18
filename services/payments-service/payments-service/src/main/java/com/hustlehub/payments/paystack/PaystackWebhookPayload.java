package com.hustlehub.payments.paystack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Minimal shape of a Paystack webhook body — only the fields this service actually reads.
 * {@code @JsonIgnoreProperties(ignoreUnknown = true)} because real Paystack webhook payloads
 * carry many more fields (customer, authorization, fees, ...) that aren't needed here.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PaystackWebhookPayload(String event, Data data) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Data(String reference, String status, Long amount) {
    }
}
