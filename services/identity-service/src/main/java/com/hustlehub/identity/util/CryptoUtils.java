package com.hustlehub.identity.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

public final class CryptoUtils {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private CryptoUtils() {
    }

    public static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    /** Opaque, high-entropy token for refresh tokens / password reset tokens. */
    public static String generateOpaqueToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** 6-digit numeric OTP for email verification. */
    public static String generateOtp() {
        int value = SECURE_RANDOM.nextInt(1_000_000);
        return String.format("%06d", value);
    }
}
