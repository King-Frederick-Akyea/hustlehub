package com.hustlehub.identity.service.storage;

import com.hustlehub.identity.entity.VerificationDocumentType;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface FileStorageService {

    /**
     * Validates and persists an uploaded file, returning the path it was stored at.
     * No serving endpoint exists yet (write-only until an admin-review feature is built).
     */
    StoredFile store(UUID userId, VerificationDocumentType type, MultipartFile file);

    /** Same validation as {@link #store}, but for the one file type that IS served back: avatars. */
    StoredFile storeAvatar(UUID userId, MultipartFile file);

    /** Reads back a previously stored file by its exact storage path (as persisted on the entity). */
    byte[] read(String storagePath);

    record StoredFile(String storagePath, String originalFilename, String contentType, long sizeBytes) {
    }
}
