package com.hustlehub.reviews.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** What a review (or its eligibility check) is attached to - a completed task, or an accepted rental/barter offer. */
public enum EngagementType {
    TASK,
    RENTAL_OFFER;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static EngagementType fromJson(String value) {
        return EngagementType.valueOf(value.trim().toUpperCase());
    }
}
