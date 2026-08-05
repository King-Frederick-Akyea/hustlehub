package com.hustlehub.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.services.reviews")
public class ReviewsServiceProperties {

    /** Base URL of reviews-service, e.g. http://localhost:8187 — not the gateway. */
    private String url;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
