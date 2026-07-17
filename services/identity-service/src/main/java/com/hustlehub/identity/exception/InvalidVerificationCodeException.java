package com.hustlehub.identity.exception;

import com.hustlehub.common.exception.ApiException;
import org.springframework.http.HttpStatus;

public class InvalidVerificationCodeException extends ApiException {

    public InvalidVerificationCodeException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
