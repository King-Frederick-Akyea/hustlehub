package com.hustlehub.gateway.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    // More specific than ProxyController's "/**" mapping, so Spring routes this one here first.
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "up", "service", "gateway-service");
    }
}
