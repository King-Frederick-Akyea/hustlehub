package com.hustlehub.identity.exception;

import com.hustlehub.common.exception.ApiException;
import org.springframework.http.HttpStatus;

/** Thrown from login/refresh when the account is suspended - the message carries the admin's reason so the frontend can show it as-is. */
public class SuspendedAccountException extends ApiException {

    public SuspendedAccountException(String reason) {
        super(HttpStatus.FORBIDDEN, reason != null && !reason.isBlank()
                ? "Your account has been suspended: " + reason
                : "Your account has been suspended.");
    }
}
