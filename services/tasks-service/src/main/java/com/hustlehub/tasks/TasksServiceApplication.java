package com.hustlehub.tasks;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.hustlehub")
public class TasksServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(TasksServiceApplication.class, args);
    }
}
