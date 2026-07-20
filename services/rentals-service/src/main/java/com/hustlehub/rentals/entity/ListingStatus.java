package com.hustlehub.rentals.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ListingStatus {
    ACTIVE,
    CLOSED;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ListingStatus fromJson(String value) {
        return ListingStatus.valueOf(value.trim().toUpperCase());
    }
}
