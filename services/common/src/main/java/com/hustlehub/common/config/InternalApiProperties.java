package com.hustlehub.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Shared secret used for service-to-service calls (e.g. tasks-service resolving a poster's
 * summary from identity-service). Not an end-user JWT — these internal endpoints are never
 * meant to be reached directly by the app, and this header is the only thing standing between
 * them and the open internet, so it's required on every internal call/endpoint.
 */
@ConfigurationProperties(prefix = "app.internal")
public class InternalApiProperties {

    public static final String HEADER_NAME = "X-Internal-Key";

    private String key;

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }
}
