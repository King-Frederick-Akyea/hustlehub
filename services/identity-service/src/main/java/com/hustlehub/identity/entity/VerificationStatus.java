package com.hustlehub.identity.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum VerificationStatus {
    PENDING,
    EMAIL_VERIFIED,
    ID_SUBMITTED,
    ID_VERIFIED,
    FACE_VERIFIED,
    FULLY_VERIFIED,
    REJECTED;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static VerificationStatus fromJson(String value) {
        return VerificationStatus.valueOf(value.trim().toUpperCase());
    }
}
