package com.hustlehub.identity.dto.response;

public record TokenPairResponse(
        String accessToken,
        String refreshToken
) {
}
