package com.hustlehub.identity.exception;

import com.hustlehub.common.exception.ApiException;
import org.springframework.http.HttpStatus;

public class UnsupportedFileTypeException extends ApiException {

    public UnsupportedFileTypeException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
