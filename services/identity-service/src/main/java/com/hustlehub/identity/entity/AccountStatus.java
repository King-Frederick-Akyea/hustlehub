package com.hustlehub.identity.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum AccountStatus {
    ACTIVE,
    SUSPENDED;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static AccountStatus fromJson(String value) {
        return AccountStatus.valueOf(value.trim().toUpperCase());
    }
}
