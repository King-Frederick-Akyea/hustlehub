package com.hustlehub.reviews;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.hustlehub")
public class ReviewsServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ReviewsServiceApplication.class, args);
    }
}
