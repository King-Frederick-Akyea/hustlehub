package com.hustlehub.gateway;

import com.hustlehub.common.exception.GlobalExceptionHandler;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

/**
 * Deliberately does NOT scan com.hustlehub.common broadly (unlike the other services) — the
 * gateway has no JWT secret and no identity-service URL configured, so common's
 * JwtAuthenticationFilter/UserServiceClient beans would fail to initialize here. It only needs
 * common's exception-handling shape, imported explicitly instead.
 */
@SpringBootApplication
@Import(GlobalExceptionHandler.class)
public class GatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
