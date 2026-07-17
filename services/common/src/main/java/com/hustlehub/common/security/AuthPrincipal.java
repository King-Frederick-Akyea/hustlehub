package com.hustlehub.common.security;

import java.util.UUID;

/**
 * The authenticated caller, built directly from JWT claims. Unlike the monolith's old
 * {@code SecurityUser} (which wrapped a full {@code User} JPA entity), services other than
 * identity-service have no {@code users} table to load one from — everything they need
 * (id/email/role) already lives in the token, so no per-request DB round-trip is needed.
 */
public record AuthPrincipal(UUID id, String email, UserRole role) {
}
