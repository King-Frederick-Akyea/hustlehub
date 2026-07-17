package com.hustlehub.identity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Broad component scan (rather than the default {@code com.hustlehub.identity} only) is
 * intentional here — unlike the gateway, this service needs {@code common}'s
 * {@code JwtAuthenticationFilter}, {@code JwtValidator}, {@code RestAuthEntryPoint},
 * {@code RestAccessDeniedHandler}, {@code GlobalExceptionHandler} and
 * {@code CommonAutoConfiguration} (which registers {@code JwtProperties}/{@code InternalApiProperties})
 * to be picked up automatically.
 *
 * <p>{@code @ConfigurationPropertiesScan} is scoped to just {@code com.hustlehub.identity} (unlike
 * the component scan above) — it only needs to pick up this service's own
 * {@code FileStorageProperties}; common's {@code @ConfigurationProperties} classes are already
 * registered explicitly by {@code CommonAutoConfiguration}.
 */
@SpringBootApplication(scanBasePackages = "com.hustlehub")
@ConfigurationPropertiesScan(basePackages = "com.hustlehub.identity")
public class IdentityServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(IdentityServiceApplication.class, args);
    }
}
