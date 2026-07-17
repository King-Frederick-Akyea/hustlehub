package com.hustlehub.gateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * The route table: adding a new service later is one new entry here, nothing else in this
 * module needs to change.
 */
@ConfigurationProperties(prefix = "app.gateway")
public class GatewayProperties {

    private List<Route> routes = new ArrayList<>();

    public List<Route> getRoutes() {
        return routes;
    }

    public void setRoutes(List<Route> routes) {
        this.routes = routes;
    }

    public static class Route {
        /** e.g. "/api/tasks" - matches this path and everything under it. */
        private String prefix;
        /** e.g. "http://localhost:8182" */
        private String target;

        public String getPrefix() {
            return prefix;
        }

        public void setPrefix(String prefix) {
            this.prefix = prefix;
        }

        public String getTarget() {
            return target;
        }

        public void setTarget(String target) {
            this.target = target;
        }
    }
}
