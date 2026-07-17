package com.hustlehub.identity.exception;

import com.hustlehub.common.exception.ApiException;
import org.springframework.http.HttpStatus;

public class InvalidOrExpiredTokenException extends ApiException {

    public InvalidOrExpiredTokenException(String message) {
        super(HttpStatus.UNAUTHORIZED, message);
    }
}
