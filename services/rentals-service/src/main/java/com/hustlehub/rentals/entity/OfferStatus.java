package com.hustlehub.rentals.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum OfferStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    WITHDRAWN;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static OfferStatus fromJson(String value) {
        return OfferStatus.valueOf(value.trim().toUpperCase());
    }
}
