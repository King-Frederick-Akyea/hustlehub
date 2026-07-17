package com.hustlehub.identity.exception;

import com.hustlehub.common.exception.ApiException;
import org.springframework.http.HttpStatus;

public class TooManyAttemptsException extends ApiException {

    public TooManyAttemptsException(String message) {
        super(HttpStatus.TOO_MANY_REQUESTS, message);
    }
}
