package com.hustlehub.payments.service;

import com.hustlehub.common.client.NotificationsServiceClient;
import com.hustlehub.common.dto.EscrowAdjustRequest;
import com.hustlehub.common.dto.EscrowHoldRequest;
import com.hustlehub.common.dto.EscrowReleaseRequest;
import com.hustlehub.common.dto.EscrowRefundRequest;
import com.hustlehub.common.dto.NotificationType;
import com.hustlehub.common.dto.TransferResult;
import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.common.exception.InvalidRequestException;
import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.payments.config.PaystackProperties;
import com.hustlehub.payments.dto.request.TopupInitializeRequest;
import com.hustlehub.payments.dto.request.WithdrawRequest;
import com.hustlehub.payments.dto.response.BalanceResponse;
import com.hustlehub.payments.dto.response.TopupInitializeResponse;
import com.hustlehub.payments.dto.response.WalletTransactionResponse;
import com.hustlehub.payments.entity.Direction;
import com.hustlehub.payments.entity.Escrow;
import com.hustlehub.payments.entity.EscrowStatus;
import com.hustlehub.payments.entity.TransactionStatus;
import com.hustlehub.payments.entity.TransactionType;
import com.hustlehub.payments.entity.WalletTransaction;
import com.hustlehub.payments.paystack.GhanaMomoBankCodes;
import com.hustlehub.payments.paystack.PaystackAmounts;
import com.hustlehub.payments.paystack.PaystackClient;
import com.hustlehub.payments.paystack.PaystackWebhookPayload;
import com.hustlehub.payments.repository.EscrowRepository;
import com.hustlehub.payments.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentsService {

    private static final Logger log = LoggerFactory.getLogger(PaymentsService.class);
    private static final String HMAC_ALGORITHM = "HmacSHA512";
    /** Bounded spin-wait for WalletTransactionRepository.tryLockWallet: 50 * 20ms = ~1s worst case. */
    private static final int LOCK_MAX_ATTEMPTS = 50;
    private static final long LOCK_RETRY_DELAY_MILLIS = 20;

    private final WalletTransactionRepository walletTransactionRepository;
    private final EscrowRepository escrowRepository;
    private final PaystackClient paystackClient;
    private final PaystackProperties paystackProperties;
    private final ObjectMapper objectMapper;
    private final NotificationsServiceClient notificationsServiceClient;

    // ------------------------------------------------------------------ topup ---

    @Transactional
    public TopupInitializeResponse initializeTopup(AuthPrincipal principal, TopupInitializeRequest request) {
        String reference = "topup_" + UUID.randomUUID();
        WalletTransaction pending = WalletTransaction.builder()
                .userId(principal.id())
                .amount(request.amount())
                .type(TransactionType.DEPOSIT)
                .direction(Direction.CREDIT)
                .status(TransactionStatus.PENDING)
                .paystackReference(reference)
                .description("Wallet top-up")
                .build();
        walletTransactionRepository.save(pending);

        long amountPesewas = PaystackAmounts.toPesewas(request.amount());
        String callbackUrl = (request.redirectUrl() == null || request.redirectUrl().isBlank())
                ? paystackProperties.getCallbackUrl() : request.redirectUrl();
        var data = paystackClient.initializeTransaction(principal.email(), amountPesewas, reference, callbackUrl);
        return new TopupInitializeResponse(data.authorizationUrl(), reference);
    }

    @Transactional
    public BalanceResponse verifyTopup(AuthPrincipal principal, String reference) {
        WalletTransaction tx = walletTransactionRepository.findByPaystackReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        if (!tx.getUserId().equals(principal.id())) {
            throw new ForbiddenActionException("You cannot verify another user's transaction");
        }

        // Idempotent: a transaction already settled (by an earlier verify call, or by the
        // webhook racing this one) is returned as-is without calling Paystack again.
        if (tx.getStatus() != TransactionStatus.COMPLETED) {
            var data = paystackClient.verifyTransaction(reference);
            boolean amountMatches = data.amount() != null
                    && data.amount() == PaystackAmounts.toPesewas(tx.getAmount());
            if ("success".equalsIgnoreCase(data.status()) && amountMatches) {
                markCompletedIfPending(tx);
            } else {
                markFailedIfPending(tx);
            }
        }
        return getBalance(principal.id());
    }

    // ---------------------------------------------------------------- webhook ---

    /**
     * Verifies {@code HMAC-SHA512(rawBody, secretKey)} (hex-encoded) against the
     * {@code x-paystack-signature} header, byte-for-byte on the exact raw request body — the
     * caller must not let anything deserialize/re-serialize the body before this runs, since
     * re-encoding could change the bytes the signature was computed over.
     */
    public boolean isValidPaystackSignature(byte[] rawBody, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        String secretKey = paystackProperties.getSecretKey();
        if (secretKey == null || secretKey.isBlank()) {
            log.error("Rejecting Paystack webhook: app.paystack.secret-key is not configured");
            return false;
        }
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            String computedHex = HexFormat.of().formatHex(mac.doFinal(rawBody));
            // Constant-time comparison — this is a signature check, not a display value.
            return MessageDigest.isEqual(
                    computedHex.getBytes(StandardCharsets.UTF_8),
                    signatureHeader.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Failed to compute Paystack webhook signature", e);
            return false;
        }
    }

    /**
     * Never throws — always logs and swallows, per Paystack's retry-on-non-2xx behavior. Caller
     * (the webhook controller) always responds 200 once the signature has checked out, regardless
     * of what happens in here.
     */
    public void handlePaystackWebhook(byte[] rawBody) {
        try {
            PaystackWebhookPayload payload = objectMapper.readValue(rawBody, PaystackWebhookPayload.class);
            if (payload.event() == null || payload.data() == null || payload.data().reference() == null) {
                log.info("Ignoring Paystack webhook with no event/data.reference");
                return;
            }
            String reference = payload.data().reference();
            switch (payload.event()) {
                case "charge.success", "transfer.success" -> markCompletedByReference(reference);
                case "transfer.failed", "transfer.reversed" -> markFailedByReference(reference);
                default -> log.info("Ignoring unrecognized Paystack webhook event: {}", payload.event());
            }
        } catch (Exception e) {
            log.error("Failed to process Paystack webhook payload", e);
        }
    }

    // Not @Transactional: called via `this.` from handlePaystackWebhook (a plain, non-proxied
    // self-invocation), so a Spring AOP @Transactional annotation here would be silently ignored
    // anyway - see the well-known Spring self-invocation pitfall. Not needed for correctness
    // either: findByPaystackReference + a conditional save() is idempotent at the state level
    // (the terminal status is the same regardless of how many times it's written), so no
    // cross-statement atomicity is required here the way it is for withdraw/transfer below.
    private void markCompletedByReference(String reference) {
        walletTransactionRepository.findByPaystackReference(reference)
                .ifPresentOrElse(this::markCompletedIfPending,
                        () -> log.warn("Paystack webhook referenced unknown transaction {}", reference));
    }

    private void markFailedByReference(String reference) {
        walletTransactionRepository.findByPaystackReference(reference)
                .ifPresentOrElse(this::markFailedIfPending,
                        () -> log.warn("Paystack webhook referenced unknown transaction {}", reference));
    }

    private void markCompletedIfPending(WalletTransaction tx) {
        if (tx.getStatus() == TransactionStatus.PENDING) {
            tx.setStatus(TransactionStatus.COMPLETED);
            tx.setCompletedAt(Instant.now());
            walletTransactionRepository.save(tx);
            NotificationType type = TransactionType.DEPOSIT.equals(tx.getType())
                    ? NotificationType.WALLET_DEPOSIT : NotificationType.WALLET_WITHDRAWAL;
            String title = TransactionType.DEPOSIT.equals(tx.getType()) ? "Deposit successful" : "Withdrawal successful";
            String body = "GH₵" + tx.getAmount() + (TransactionType.DEPOSIT.equals(tx.getType())
                    ? " was added to your wallet" : " was sent to your mobile money account");
            notificationsServiceClient.notify(tx.getUserId(), type, title, body, null);
        }
    }

    private void markFailedIfPending(WalletTransaction tx) {
        if (tx.getStatus() == TransactionStatus.PENDING) {
            tx.setStatus(TransactionStatus.FAILED);
            walletTransactionRepository.save(tx);
            if (TransactionType.WITHDRAWAL.equals(tx.getType())) {
                notificationsServiceClient.notify(tx.getUserId(), NotificationType.WALLET_WITHDRAWAL_FAILED,
                        "Withdrawal failed", "Your GH₵" + tx.getAmount() + " withdrawal could not be completed. The funds remain in your wallet.", null);
            }
        }
    }

    // --------------------------------------------------------------- withdraw ---

    @Transactional
    public WalletTransactionResponse withdraw(AuthPrincipal principal, WithdrawRequest request) {
        String bankCode = GhanaMomoBankCodes.resolve(request.provider());

        lockWallet(principal.id());
        BigDecimal available = availableBalance(principal.id());
        if (request.amount().compareTo(available) > 0) {
            throw new InvalidRequestException("Insufficient available balance");
        }

        var recipient = paystackClient.createTransferRecipient(
                "HustleHub Withdrawal", request.mobileMoneyNumber(), bankCode);
        String reference = "withdraw_" + UUID.randomUUID();
        long amountPesewas = PaystackAmounts.toPesewas(request.amount());
        paystackClient.initiateTransfer(amountPesewas, recipient.recipientCode(), reference, "HustleHub wallet withdrawal");

        WalletTransaction pending = WalletTransaction.builder()
                .userId(principal.id())
                .amount(request.amount())
                .type(TransactionType.WITHDRAWAL)
                .direction(Direction.DEBIT)
                .status(TransactionStatus.PENDING)
                .paystackReference(reference)
                .description("Mobile money withdrawal via " + request.provider().trim().toUpperCase() + " to " + request.mobileMoneyNumber())
                .build();
        return WalletTransactionResponse.from(walletTransactionRepository.save(pending));
    }

    // ------------------------------------------------------------------ escrow ---

    @Transactional
    public TransferResult hold(EscrowHoldRequest request) {
        if (request.payerId() == null || request.amount() == null || request.relatedEntityId() == null
                || request.entityType() == null || request.entityType().isBlank()) {
            return TransferResult.failure("invalid_request");
        }
        if (request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            return TransferResult.failure("invalid_amount");
        }
        if (escrowRepository.findByRelatedEntityId(request.relatedEntityId()).isPresent()) {
            return TransferResult.failure("escrow_already_exists");
        }

        lockWallet(request.payerId());
        if (request.amount().compareTo(availableBalance(request.payerId())) > 0) {
            return TransferResult.failure("insufficient_funds");
        }

        escrowRepository.save(Escrow.builder()
                .payerId(request.payerId())
                .entityType(request.entityType())
                .relatedEntityId(request.relatedEntityId())
                .amount(request.amount())
                .status(EscrowStatus.HELD)
                .build());
        walletTransactionRepository.save(debitRow(request.payerId(), request.amount(), TransactionType.ESCROW_HOLD,
                null, request.relatedEntityId(), request.description()));
        return TransferResult.ok();
    }

    @Transactional
    public TransferResult adjustHold(EscrowAdjustRequest request) {
        if (request.newAmount() == null || request.newAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return TransferResult.failure("invalid_amount");
        }
        Escrow escrow = requireHeldEscrow(request.relatedEntityId());
        BigDecimal delta = request.newAmount().subtract(escrow.getAmount());
        if (delta.signum() == 0) {
            return TransferResult.ok();
        }

        lockWallet(escrow.getPayerId());
        if (delta.signum() > 0) {
            if (delta.compareTo(availableBalance(escrow.getPayerId())) > 0) {
                return TransferResult.failure("insufficient_funds");
            }
            walletTransactionRepository.save(debitRow(escrow.getPayerId(), delta, TransactionType.ESCROW_TOPUP,
                    null, escrow.getRelatedEntityId(), "Additional hold for accepted offer"));
        } else {
            walletTransactionRepository.save(creditRow(escrow.getPayerId(), delta.negate(), TransactionType.ESCROW_REFUND,
                    null, escrow.getRelatedEntityId(), "Partial refund - accepted offer was lower than held amount"));
        }
        escrow.setAmount(request.newAmount());
        escrowRepository.save(escrow);
        return TransferResult.ok();
    }

    @Transactional
    public void releaseHold(EscrowReleaseRequest request) {
        Escrow escrow = requireHeldEscrow(request.relatedEntityId());
        String paymentType = "TASK".equals(escrow.getEntityType()) ? TransactionType.TASK_PAYMENT : TransactionType.RENTAL_PAYMENT;
        walletTransactionRepository.save(creditRow(request.beneficiaryId(), escrow.getAmount(), paymentType,
                escrow.getPayerId(), escrow.getRelatedEntityId(), "Escrow release"));
        escrow.setStatus(EscrowStatus.RELEASED);
        escrow.setResolvedAt(Instant.now());
        escrowRepository.save(escrow);
    }

    @Transactional
    public void refundHold(EscrowRefundRequest request) {
        Escrow escrow = requireHeldEscrow(request.relatedEntityId());
        walletTransactionRepository.save(creditRow(escrow.getPayerId(), escrow.getAmount(), TransactionType.ESCROW_REFUND,
                null, escrow.getRelatedEntityId(), "Escrow refund"));
        escrow.setStatus(EscrowStatus.REFUNDED);
        escrow.setResolvedAt(Instant.now());
        escrowRepository.save(escrow);
    }

    private Escrow requireHeldEscrow(UUID relatedEntityId) {
        Escrow escrow = escrowRepository.findByRelatedEntityId(relatedEntityId)
                .orElseThrow(() -> new IllegalStateException("No escrow found for " + relatedEntityId));
        if (escrow.getStatus() != EscrowStatus.HELD) {
            throw new IllegalStateException("Escrow for " + relatedEntityId + " is already " + escrow.getStatus());
        }
        return escrow;
    }

    private WalletTransaction debitRow(UUID userId, BigDecimal amount, String type, UUID relatedUserId, UUID relatedEntityId, String description) {
        return WalletTransaction.builder()
                .userId(userId).amount(amount).type(type).direction(Direction.DEBIT).status(TransactionStatus.COMPLETED)
                .relatedUserId(relatedUserId).relatedEntityId(relatedEntityId).description(description).completedAt(Instant.now())
                .build();
    }

    private WalletTransaction creditRow(UUID userId, BigDecimal amount, String type, UUID relatedUserId, UUID relatedEntityId, String description) {
        return WalletTransaction.builder()
                .userId(userId).amount(amount).type(type).direction(Direction.CREDIT).status(TransactionStatus.COMPLETED)
                .relatedUserId(relatedUserId).relatedEntityId(relatedEntityId).description(description).completedAt(Instant.now())
                .build();
    }

    // ------------------------------------------------------------- reads ---

    @Transactional(readOnly = true)
    public BalanceResponse getBalance(UUID userId) {
        BigDecimal available = availableBalance(userId);
        BigDecimal pendingWithdrawals = walletTransactionRepository.pendingWithdrawals(userId);
        BigDecimal held = escrowRepository.heldBalance(userId);
        return new BalanceResponse(available, pendingWithdrawals, held);
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionResponse> getTransactions(UUID userId) {
        return walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(WalletTransactionResponse::from)
                .toList();
    }

    // ------------------------------------------------------------- helpers ---

    private BigDecimal availableBalance(UUID userId) {
        BigDecimal completed = walletTransactionRepository.completedBalance(userId);
        BigDecimal pendingWithdrawals = walletTransactionRepository.pendingWithdrawals(userId);
        return completed.subtract(pendingWithdrawals);
    }

    /** Blocks (via bounded retry) until this DB transaction holds the per-user advisory lock. See WalletTransactionRepository.tryLockWallet. */
    private void lockWallet(UUID userId) {
        for (int attempt = 0; attempt < LOCK_MAX_ATTEMPTS; attempt++) {
            if (walletTransactionRepository.tryLockWallet(userId)) {
                return;
            }
            try {
                Thread.sleep(LOCK_RETRY_DELAY_MILLIS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Interrupted while waiting for wallet lock for user " + userId, e);
            }
        }
        throw new IllegalStateException("Could not acquire wallet lock for user " + userId + " (too much contention)");
    }
}
