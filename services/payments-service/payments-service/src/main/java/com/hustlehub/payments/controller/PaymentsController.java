package com.hustlehub.payments.controller;

import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.payments.dto.request.TopupInitializeRequest;
import com.hustlehub.payments.dto.request.WithdrawRequest;
import com.hustlehub.payments.dto.response.BalanceResponse;
import com.hustlehub.payments.dto.response.TopupInitializeResponse;
import com.hustlehub.payments.dto.response.WalletTransactionResponse;
import com.hustlehub.payments.service.PaymentsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentsController {

    private final PaymentsService paymentsService;

    @PostMapping("/topup/initialize")
    public TopupInitializeResponse initializeTopup(@AuthenticationPrincipal AuthPrincipal principal,
                                                     @Valid @RequestBody TopupInitializeRequest request) {
        return paymentsService.initializeTopup(principal, request);
    }

    @GetMapping("/topup/verify/{reference}")
    public BalanceResponse verifyTopup(@AuthenticationPrincipal AuthPrincipal principal,
                                        @PathVariable String reference) {
        return paymentsService.verifyTopup(principal, reference);
    }

    @PostMapping("/withdraw")
    public WalletTransactionResponse withdraw(@AuthenticationPrincipal AuthPrincipal principal,
                                               @Valid @RequestBody WithdrawRequest request) {
        return paymentsService.withdraw(principal, request);
    }

    @GetMapping("/balance")
    public BalanceResponse getBalance(@AuthenticationPrincipal AuthPrincipal principal) {
        return paymentsService.getBalance(principal.id());
    }

    @GetMapping("/transactions")
    public List<WalletTransactionResponse> getMyTransactions(@AuthenticationPrincipal AuthPrincipal principal) {
        return paymentsService.getTransactions(principal.id());
    }
}
