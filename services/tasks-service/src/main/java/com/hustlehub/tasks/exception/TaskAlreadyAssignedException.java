package com.hustlehub.tasks.exception;

import com.hustlehub.common.exception.ApiException;
import org.springframework.http.HttpStatus;

public class TaskAlreadyAssignedException extends ApiException {

    public TaskAlreadyAssignedException() {
        super(HttpStatus.CONFLICT, "This task has already been assigned to someone else");
    }
}
