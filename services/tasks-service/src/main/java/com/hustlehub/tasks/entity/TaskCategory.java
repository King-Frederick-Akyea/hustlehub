package com.hustlehub.tasks.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TaskCategory {
    GROCERY,
    LAUNDRY,
    DOCUMENTS,
    QUEUE,
    DELIVERY,
    TUTORING,
    CLEANING,
    TECH,
    MOVING,
    OTHER;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static TaskCategory fromJson(String value) {
        return TaskCategory.valueOf(value.trim().toUpperCase());
    }
}
