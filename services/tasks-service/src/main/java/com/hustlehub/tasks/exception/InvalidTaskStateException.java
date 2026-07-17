package com.hustlehub.tasks.exception;

import com.hustlehub.common.exception.ApiException;
import org.springframework.http.HttpStatus;

public class InvalidTaskStateException extends ApiException {

    public InvalidTaskStateException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
