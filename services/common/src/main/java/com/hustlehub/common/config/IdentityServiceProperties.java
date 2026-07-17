package com.hustlehub.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.services.identity")
public class IdentityServiceProperties {

    /** Base URL of identity-service, e.g. http://localhost:8181 — not the gateway. */
    private String url;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
