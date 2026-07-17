package com.hustlehub.common.security;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum UserRole {
    POSTER,
    TASKER,
    BOTH;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static UserRole fromJson(String value) {
        return UserRole.valueOf(value.trim().toUpperCase());
    }
}
