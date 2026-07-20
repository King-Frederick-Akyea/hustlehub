package com.hustlehub.payments.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Registers PaystackProperties explicitly rather than relying on component-scan alone to pick it
 * up — mirrors how common's CommonAutoConfiguration registers its own @ConfigurationProperties
 * classes.
 */
@Configuration
@EnableConfigurationProperties(PaystackProperties.class)
public class PaystackConfig {
}
