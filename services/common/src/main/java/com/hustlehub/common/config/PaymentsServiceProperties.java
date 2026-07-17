package com.hustlehub.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.services.payments")
public class PaymentsServiceProperties {

    /** Base URL of payments-service, e.g. http://localhost:8185 — not the gateway. */
    private String url;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
