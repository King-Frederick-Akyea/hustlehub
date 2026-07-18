package com.hustlehub.payments.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Local to this service on purpose (unlike common's IdentityServiceProperties/
 * PaymentsServiceProperties) — nothing else in the reactor talks to Paystack directly.
 * {@code secretKey} has no default and is allowed to be blank at startup (see
 * application.properties); PaystackClient fails fast with a clear error only when an endpoint
 * actually tries to use it, not at boot time, since a fresh checkout shouldn't fail to start
 * just because nobody's pasted a real test key in yet.
 */
@ConfigurationProperties(prefix = "app.paystack")
public class PaystackProperties {

    private String secretKey;
    private String baseUrl = "https://api.paystack.co";
    private String callbackUrl;

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getCallbackUrl() {
        return callbackUrl;
    }

    public void setCallbackUrl(String callbackUrl) {
        this.callbackUrl = callbackUrl;
    }
}
