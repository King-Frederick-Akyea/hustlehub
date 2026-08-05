package com.hustlehub.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.services.rentals")
public class RentalsServiceProperties {

    /** Base URL of rentals-service, e.g. http://localhost:8186 — not the gateway. */
    private String url;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
