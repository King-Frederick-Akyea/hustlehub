package com.hustlehub.reviews.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ReportStatus {
    OPEN,
    REVIEWED,
    ACTIONED,
    DISMISSED;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ReportStatus fromJson(String value) {
        return ReportStatus.valueOf(value.trim().toUpperCase());
    }
}
