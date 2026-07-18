package com.hustlehub.payments.controller;

import com.hustlehub.common.config.InternalApiProperties;
import com.hustlehub.common.dto.EscrowAdjustRequest;
import com.hustlehub.common.dto.EscrowHoldRequest;
import com.hustlehub.common.dto.EscrowReleaseRequest;
import com.hustlehub.common.dto.EscrowRefundRequest;
import com.hustlehub.common.dto.TransferResult;
import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.payments.service.PaymentsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Implements common's PaymentsServiceClient contract for other services (tasks-service,
 * rentals-service). Not reachable by end users — protected by a shared internal key instead of a
 * user JWT, checked here in the controller (see SecurityConfig, which permits this path without
 * authentication). Mirrors identity-service's InternalUserController exactly, including making
 * the header optional at the binding level so a missing header 403s via ForbiddenActionException
 * instead of 500ing via an unhandled MissingRequestHeaderException.
 */
@RestController
@RequestMapping("/internal/payments/escrow")
@RequiredArgsConstructor
public class InternalPaymentsController {

    private final PaymentsService paymentsService;
    private final InternalApiProperties internalApiProperties;

    @PostMapping("/hold")
    public TransferResult hold(@RequestBody EscrowHoldRequest request,
                                @RequestHeader(value = InternalApiProperties.HEADER_NAME, required = false) String key) {
        requireInternalKey(key);
        return paymentsService.hold(request);
    }

    @PostMapping("/adjust")
    public TransferResult adjust(@RequestBody EscrowAdjustRequest request,
                                  @RequestHeader(value = InternalApiProperties.HEADER_NAME, required = false) String key) {
        requireInternalKey(key);
        return paymentsService.adjustHold(request);
    }

    @PostMapping("/release")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void release(@RequestBody EscrowReleaseRequest request,
                         @RequestHeader(value = InternalApiProperties.HEADER_NAME, required = false) String key) {
        requireInternalKey(key);
        paymentsService.releaseHold(request);
    }

    @PostMapping("/refund")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void refund(@RequestBody EscrowRefundRequest request,
                        @RequestHeader(value = InternalApiProperties.HEADER_NAME, required = false) String key) {
        requireInternalKey(key);
        paymentsService.refundHold(request);
    }

    private void requireInternalKey(String provided) {
        if (provided == null || !internalApiProperties.getKey().equals(provided)) {
            throw new ForbiddenActionException("Invalid internal API key");
        }
    }
}
