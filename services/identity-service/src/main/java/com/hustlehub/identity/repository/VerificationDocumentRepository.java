package com.hustlehub.identity.repository;

import com.hustlehub.identity.entity.VerificationDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface VerificationDocumentRepository extends JpaRepository<VerificationDocument, UUID> {
}
