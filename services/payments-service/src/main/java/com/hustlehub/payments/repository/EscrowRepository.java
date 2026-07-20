package com.hustlehub.payments.repository;

import com.hustlehub.payments.entity.Escrow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface EscrowRepository extends JpaRepository<Escrow, UUID> {

    Optional<Escrow> findByRelatedEntityId(UUID relatedEntityId);

    /** Total currently held for this payer, across every active (not yet released/refunded) escrow - shown in the balance response for transparency. */
    @Query("select coalesce(sum(e.amount), 0) from Escrow e "
            + "where e.payerId = :payerId and e.status = com.hustlehub.payments.entity.EscrowStatus.HELD")
    BigDecimal heldBalance(@Param("payerId") UUID payerId);
}
