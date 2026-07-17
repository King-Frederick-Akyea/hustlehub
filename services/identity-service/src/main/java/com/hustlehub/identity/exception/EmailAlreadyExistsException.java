package com.hustlehub.identity.exception;

import com.hustlehub.common.exception.ApiException;
import org.springframework.http.HttpStatus;

public class EmailAlreadyExistsException extends ApiException {

    public EmailAlreadyExistsException(String email) {
        super(HttpStatus.CONFLICT, "An account with email " + email + " already exists");
    }
}
