package com.hustlehub.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Generic 400 for malformed/invalid requests that don't fit a more specific exception
 * (e.g. trying to start a conversation with yourself).
 */
public class InvalidRequestException extends ApiException {

    public InvalidRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
