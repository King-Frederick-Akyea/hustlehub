package com.hustlehub.identity.repository;

import com.hustlehub.identity.entity.EmailVerificationCode;
import com.hustlehub.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, UUID> {

    Optional<EmailVerificationCode> findFirstByUserAndConsumedAtIsNullOrderByCreatedAtDesc(User user);
}
