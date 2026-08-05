package com.hustlehub.common.config;

import com.hustlehub.common.security.JwtProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Registers common's {@code @ConfigurationProperties} classes explicitly rather than relying on
 * component-scan alone to pick them up — every service must include {@code com.hustlehub.common}
 * in its {@code scanBasePackages} (see each service's {@code *Application} class) for this class
 * itself to be found, but this makes the properties binding unambiguous either way.
 */
@Configuration
@EnableConfigurationProperties({JwtProperties.class, InternalApiProperties.class, IdentityServiceProperties.class, PaymentsServiceProperties.class, NotificationsServiceProperties.class, TasksServiceProperties.class, RentalsServiceProperties.class, ReviewsServiceProperties.class})
public class CommonAutoConfiguration {
}
