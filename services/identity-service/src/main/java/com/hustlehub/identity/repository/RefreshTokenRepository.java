package com.hustlehub.identity.repository;

import com.hustlehub.identity.entity.RefreshToken;
import com.hustlehub.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update RefreshToken r set r.revokedAt = :now where r.user = :user and r.revokedAt is null")
    void revokeAllActiveForUser(@Param("user") User user, @Param("now") Instant now);
}
