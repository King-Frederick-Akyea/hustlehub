package com.hustlehub.identity.dto.response;

public record AdminAuthResponse(String accessToken, long expiresInSeconds) {
}
