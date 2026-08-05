package com.hustlehub.reviews.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ReportReasonCategory {
    HARASSMENT,
    SCAM_FRAUD,
    INAPPROPRIATE_CONTENT,
    NO_SHOW,
    FAKE_LISTING,
    OTHER;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ReportReasonCategory fromJson(String value) {
        return ReportReasonCategory.valueOf(value.trim().toUpperCase());
    }
}
