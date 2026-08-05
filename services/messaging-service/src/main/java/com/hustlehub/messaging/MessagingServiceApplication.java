package com.hustlehub.messaging;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/** {@code @ConfigurationPropertiesScan} picks up this service's own {@code UploadsProperties} (chat images) - see identity-service's Application class for why it's scoped narrowly instead of relying on the broad component scan above. */
@SpringBootApplication(scanBasePackages = "com.hustlehub")
@ConfigurationPropertiesScan(basePackages = "com.hustlehub.messaging")
public class MessagingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(MessagingServiceApplication.class, args);
    }
}
