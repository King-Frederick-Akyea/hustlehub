package com.hustlehub.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.services.notifications")
public class NotificationsServiceProperties {

    /** Base URL of notifications-service, e.g. http://localhost:8184 — not the gateway. */
    private String url;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
