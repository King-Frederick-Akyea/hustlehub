package com.hustlehub.rentals.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum OfferType {
    CASH,
    BARTER;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static OfferType fromJson(String value) {
        return OfferType.valueOf(value.trim().toUpperCase());
    }
}
