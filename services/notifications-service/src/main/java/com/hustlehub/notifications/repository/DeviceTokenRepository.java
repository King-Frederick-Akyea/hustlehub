package com.hustlehub.notifications.repository;

import com.hustlehub.notifications.entity.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, UUID> {

    List<DeviceToken> findByUserId(UUID userId);

    Optional<DeviceToken> findByExpoPushToken(String expoPushToken);

    // Derived delete-by-query methods load-then-remove each match, which needs an active
    // transaction - unlike save()/findBy...(), this isn't transactional by default, and calling it
    // without @Transactional throws "No EntityManager with actual transaction available" at runtime.
    @Transactional
    void deleteByExpoPushToken(String expoPushToken);
}
