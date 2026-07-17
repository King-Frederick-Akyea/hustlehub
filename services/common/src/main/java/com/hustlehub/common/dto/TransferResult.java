package com.hustlehub.common.dto;

/**
 * Result of an internal wallet-to-wallet transfer. {@code success = false} with a
 * {@code failureReason} (e.g. "insufficient_funds") is an expected business outcome, not an
 * error - callers (TaskService.completeTask, rentals-service's offer-accept) are expected to
 * handle it without the underlying entity's own lifecycle failing. A thrown
 * UpstreamServiceException from the client means something actually went wrong (payments-service
 * unreachable, malformed response), which is a different, genuinely exceptional case.
 */
public record TransferResult(boolean success, String failureReason) {

    public static TransferResult ok() {
        return new TransferResult(true, null);
    }

    public static TransferResult failure(String reason) {
        return new TransferResult(false, reason);
    }
}
