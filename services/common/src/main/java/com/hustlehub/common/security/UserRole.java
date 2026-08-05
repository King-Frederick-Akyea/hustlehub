package com.hustlehub.common.security;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum UserRole {
    POSTER,
    TASKER,
    BOTH,
    /** Not a student account - minted only by AdminAuthController's hardcoded-credential login, never persisted as a User row. */
    ADMIN;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static UserRole fromJson(String value) {
        return UserRole.valueOf(value.trim().toUpperCase());
    }
}
