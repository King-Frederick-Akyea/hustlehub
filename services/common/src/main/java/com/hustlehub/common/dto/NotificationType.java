package com.hustlehub.common.dto;

/** Every category of push/in-app notification a domain service can trigger. One unambiguous frontend navigation target per type. */
public enum NotificationType {
    BID_RECEIVED,
    BID_ACCEPTED,
    BID_REJECTED,
    BID_WITHDRAWN,
    TASK_ACCEPTED,
    TASK_COMPLETED,
    TASK_PAYMENT_RECEIVED,
    RENTAL_OFFER_RECEIVED,
    RENTAL_OFFER_ACCEPTED,
    RENTAL_OFFER_REJECTED,
    RENTAL_OFFER_WITHDRAWN,
    RENTAL_PAYMENT_RECEIVED,
    NEW_MESSAGE,
    WALLET_DEPOSIT,
    WALLET_WITHDRAWAL,
    WALLET_WITHDRAWAL_FAILED
}
