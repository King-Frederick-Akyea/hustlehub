package com.hustlehub.gateway.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableConfigurationProperties(GatewayProperties.class)
public class GatewayConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Gateway is the single public entry point, so CORS lives here once instead of being
        // duplicated across every downstream service (which the app never talks to directly).
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);
    }

    @Bean
    public org.springframework.web.client.RestClient proxyRestClient() {
        return org.springframework.web.client.RestClient.create();
    }
}
