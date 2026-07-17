package com.hustlehub.common.exception;

import com.hustlehub.common.dto.ApiErrorResponse;
import com.hustlehub.common.dto.FieldErrorItem;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException ex, HttpServletRequest request) {
        HttpStatus status = ex.getStatus();
        return ResponseEntity.status(status).body(ApiErrorResponse.of(
                status.value(), status.getReasonPhrase(), ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<FieldErrorItem> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new FieldErrorItem(fe.getField(), messageOf(fe)))
                .toList();
        return ResponseEntity.badRequest().body(ApiErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(), HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Validation failed", request.getRequestURI(), fieldErrors));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleUploadTooLarge(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE).body(ApiErrorResponse.of(
                HttpStatus.CONTENT_TOO_LARGE.value(), HttpStatus.CONTENT_TOO_LARGE.getReasonPhrase(),
                "Uploaded file is too large", request.getRequestURI()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(), HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                "Invalid email or password", request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(), HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                "Something went wrong. Please try again.", request.getRequestURI()));
    }

    private String messageOf(FieldError fe) {
        return fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value";
    }
}
