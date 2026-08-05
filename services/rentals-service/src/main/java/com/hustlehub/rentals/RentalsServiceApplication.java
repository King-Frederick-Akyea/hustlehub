package com.hustlehub.rentals;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/** {@code @ConfigurationPropertiesScan} picks up this service's own {@code UploadsProperties} (listing images) - see identity-service's Application class for why it's scoped narrowly instead of relying on the broad component scan above. */
@SpringBootApplication(scanBasePackages = "com.hustlehub")
@ConfigurationPropertiesScan(basePackages = "com.hustlehub.rentals")
public class RentalsServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(RentalsServiceApplication.class, args);
    }
}
