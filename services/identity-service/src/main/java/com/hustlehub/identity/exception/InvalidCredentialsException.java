package com.hustlehub.identity.exception;

import com.hustlehub.common.exception.ApiException;
import org.springframework.http.HttpStatus;

public class InvalidCredentialsException extends ApiException {

    public InvalidCredentialsException() {
        super(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }
}
