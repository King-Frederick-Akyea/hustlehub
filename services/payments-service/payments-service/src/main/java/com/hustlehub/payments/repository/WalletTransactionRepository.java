package com.hustlehub.payments.repository;

import com.hustlehub.payments.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, UUID> {

    List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<WalletTransaction> findByPaystackReference(String paystackReference);

    /** SUM(amount WHERE status=COMPLETED AND direction=CREDIT) - SUM(amount WHERE status=COMPLETED AND direction=DEBIT). */
    @Query("select coalesce(sum(case when wt.direction = com.hustlehub.payments.entity.Direction.CREDIT then wt.amount "
            + "else -wt.amount end), 0) "
            + "from WalletTransaction wt "
            + "where wt.userId = :userId and wt.status = com.hustlehub.payments.entity.TransactionStatus.COMPLETED")
    BigDecimal completedBalance(@Param("userId") UUID userId);

    /** SUM(amount WHERE status=PENDING AND direction=DEBIT AND type=WITHDRAWAL) — funds already earmarked, not yet settled. */
    @Query("select coalesce(sum(wt.amount), 0) "
            + "from WalletTransaction wt "
            + "where wt.userId = :userId and wt.status = com.hustlehub.payments.entity.TransactionStatus.PENDING "
            + "and wt.direction = com.hustlehub.payments.entity.Direction.DEBIT "
            + "and wt.type = com.hustlehub.payments.entity.TransactionType.WITHDRAWAL")
    BigDecimal pendingWithdrawals(@Param("userId") UUID userId);

    /**
     * Acquires a Postgres session-scoped advisory lock keyed on {@code userId}, non-blocking
     * (returns immediately with a boolean rather than waiting). Held for the rest of the current
     * DB transaction and released automatically on commit/rollback — never needs an explicit
     * unlock. Callers should retry (with a short backoff) until this returns true before reading
     * the balance and writing new rows.
     * <p>
     * This closes the classic check-then-act race: without it, two concurrent withdrawals (or a
     * withdrawal racing an internal transfer) could both read the same available balance before
     * either has written its row, and both would proceed — overdrawing the wallet. Serializing
     * per-user around the balance-check-and-write critical section prevents that.
     * <p>
     * {@code hashtext()} collapses the UUID into a 32-bit lock key; a hash collision between two
     * unrelated users only costs some unnecessary serialization between them (the balance check
     * itself still reads fresh, already-committed data), never a correctness problem.
     */
    @Query(value = "select pg_try_advisory_xact_lock(hashtext(cast(:userId as text)))", nativeQuery = true)
    boolean tryLockWallet(@Param("userId") UUID userId);
}
