package com.hustlehub.rentals.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ListingType {
    RENTAL,
    BARTER;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ListingType fromJson(String value) {
        return ListingType.valueOf(value.trim().toUpperCase());
    }
}
