package com.hustlehub.tasks.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum BidStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    WITHDRAWN;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static BidStatus fromJson(String value) {
        return BidStatus.valueOf(value.trim().toUpperCase());
    }
}
