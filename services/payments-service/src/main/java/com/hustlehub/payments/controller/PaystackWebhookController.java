package com.hustlehub.payments.controller;

import com.hustlehub.payments.service.PaymentsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

/**
 * No JWT here (see SecurityConfig — this path is permitAll) — Paystack calls this directly, not
 * through the app. The signature check below is what stands in for authentication.
 */
@RestController
@RequestMapping("/api/payments/webhooks")
@RequiredArgsConstructor
public class PaystackWebhookController {

    private static final Logger log = LoggerFactory.getLogger(PaystackWebhookController.class);

    private final PaymentsService paymentsService;

    @PostMapping("/paystack")
    public ResponseEntity<Void> handleWebhook(HttpServletRequest request) throws IOException {
        // Read the exact raw bytes before anything (Spring, Jackson) gets a chance to
        // deserialize/re-encode the body - the signature is computed over these exact bytes.
        byte[] rawBody = request.getInputStream().readAllBytes();
        String signature = request.getHeader("x-paystack-signature");

        if (!paymentsService.isValidPaystackSignature(rawBody, signature)) {
            log.warn("Rejected Paystack webhook: missing or invalid x-paystack-signature");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        paymentsService.handlePaystackWebhook(rawBody);
        // Always 200 once the signature checks out - Paystack retries aggressively on non-2xx,
        // and handlePaystackWebhook already logs-and-swallows anything it can't process.
        return ResponseEntity.ok().build();
    }
}
