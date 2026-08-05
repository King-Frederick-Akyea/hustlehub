package com.hustlehub.identity.repository;

import com.hustlehub.identity.entity.User;
import com.hustlehub.identity.entity.VerificationDocument;
import com.hustlehub.identity.entity.VerificationDocumentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface VerificationDocumentRepository extends JpaRepository<VerificationDocument, UUID> {

    // Used by the admin panel to view a user's uploaded ID/face photo before granting adminVerified.
    Optional<VerificationDocument> findFirstByUserAndTypeOrderByCreatedAtDesc(User user, VerificationDocumentType type);
}
