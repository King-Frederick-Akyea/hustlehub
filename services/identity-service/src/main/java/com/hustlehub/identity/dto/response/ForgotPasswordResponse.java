package com.hustlehub.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ForgotPasswordResponse(String message, String devResetToken) {
}
