package com.hustlehub.payments.paystack;

import com.hustlehub.common.exception.InvalidRequestException;

/**
 * Maps a Ghana mobile money network name to the {@code bank_code} Paystack expects when creating
 * a {@code type: "mobile_money"} transfer recipient.
 * <p>
 * <b>UNVERIFIED — no live Paystack account was available while building this.</b> The three
 * codes below are my best recollection of Paystack's Ghana mobile money codes and may be wrong
 * or outdated. Before relying on this in anything but test mode: check Paystack's dashboard
 * (Transfers -&gt; Recipients -&gt; add a mobile money recipient, the network dropdown shows the
 * live codes) or {@code GET https://api.paystack.co/bank?country=ghana&type=mobile_money}, and
 * fix whichever line below is wrong — that's the only change needed, everything else in the
 * withdraw flow is code-code and doesn't need touching.
 */
public final class GhanaMomoBankCodes {

    private GhanaMomoBankCodes() {
    }

    public static String resolve(String provider) {
        if (provider == null || provider.isBlank()) {
            throw new InvalidRequestException("Mobile money provider is required");
        }
        return switch (provider.trim().toUpperCase()) {
            case "MTN" -> "MTN";                                    // MTN Mobile Money — VERIFY against live Paystack
            case "VODAFONE", "VOD", "TELECEL" -> "VOD";              // Vodafone Cash / rebranded Telecel Cash — VERIFY
            case "AIRTELTIGO", "ATL", "AIRTEL_TIGO" -> "ATL";        // AirtelTigo Money — VERIFY
            default -> throw new InvalidRequestException("Unsupported mobile money provider: " + provider);
        };
    }
}
