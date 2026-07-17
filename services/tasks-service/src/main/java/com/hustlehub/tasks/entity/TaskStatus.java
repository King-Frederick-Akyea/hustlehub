package com.hustlehub.tasks.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TaskStatus {
    OPEN,
    /** Reserved for a future bidding-window countdown UI; not currently a distinct reachable state. */
    BIDDING,
    /** Reserved for a future "matched but not yet started" UI step; assignment goes straight to IN_PROGRESS today. */
    ASSIGNED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED,
    /** Reserved for a future dispute-resolution feature. */
    DISPUTED;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static TaskStatus fromJson(String value) {
        return TaskStatus.valueOf(value.trim().toUpperCase());
    }
}
