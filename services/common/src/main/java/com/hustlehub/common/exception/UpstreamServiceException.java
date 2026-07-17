package com.hustlehub.common.exception;

import org.springframework.http.HttpStatus;

/** Thrown when a call to another internal service (e.g. identity-service) fails or times out. */
public class UpstreamServiceException extends ApiException {

    public UpstreamServiceException(String message) {
        super(HttpStatus.SERVICE_UNAVAILABLE, message);
    }
}
