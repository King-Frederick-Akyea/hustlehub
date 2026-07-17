package com.hustlehub.common.client;

import com.hustlehub.common.dto.TransferResult;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * The escrow lifecycle other services fund and settle against, without any of them owning the
 * wallet_transactions/escrows tables themselves: hold funds when a payer commits to something
 * (posting a task, making a rental cash offer), adjust the held amount if the committed price
 * changes (a poster accepting a bid at a different price than the listed budget), then either
 * release it to whoever earned it or refund it back to the payer.
 * <p>
 * hold/adjustHold return a soft {@link TransferResult} - insufficient funds is an expected
 * business outcome the caller must handle (reject the task/offer creation, or the bid-accept),
 * not an error. releaseHold/refundHold throw on failure instead - by the time either is called
 * the funds are already reserved, so a failure here can only mean a real bug or payments-service
 * being unreachable, not "the payer can't afford it".
 */
public interface PaymentsServiceClient {

    /**
     * @param entityType      e.g. "TASK", "RENTAL_OFFER"
     * @param relatedEntityId the task or offer this hold is for - becomes the key every later
     *                        adjust/release/refund call is addressed by
     */
    TransferResult hold(UUID payerId, BigDecimal amount, String entityType, UUID relatedEntityId, String description);

    /** Tops up (charges more) if newAmount is higher than what's currently held, refunds the difference if lower. */
    TransferResult adjustHold(UUID relatedEntityId, BigDecimal newAmount);

    /** Pays the held amount out to beneficiaryId. Throws (does not soft-fail) if the escrow can't be found or isn't HELD. */
    void releaseHold(UUID relatedEntityId, UUID beneficiaryId);

    /** Returns the held amount to whoever funded it. Throws (does not soft-fail) if the escrow can't be found or isn't HELD. */
    void refundHold(UUID relatedEntityId);
}
