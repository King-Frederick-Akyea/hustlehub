package com.hustlehub.payments.paystack;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Paystack's API works in the smallest currency unit (pesewas for GHS = cedis x 100), never
 * decimal cedis. Converting via setScale(2) first guarantees the subsequent x100 lands on a
 * whole number, so longValueExact() is safe (throws instead of silently truncating if it
 * somehow isn't — a rounding bug here would be a real-money bug, better to fail loudly).
 */
public final class PaystackAmounts {

    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

    private PaystackAmounts() {
    }

    public static long toPesewas(BigDecimal ghsAmount) {
        return ghsAmount.setScale(2, RoundingMode.HALF_UP)
                .multiply(ONE_HUNDRED)
                .longValueExact();
    }

    public static BigDecimal fromPesewas(long pesewas) {
        return BigDecimal.valueOf(pesewas).movePointLeft(2);
    }
}
