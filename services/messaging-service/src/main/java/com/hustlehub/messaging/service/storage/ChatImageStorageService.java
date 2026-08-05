package com.hustlehub.messaging.service.storage;

import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface ChatImageStorageService {

    /** Validates (JPEG/PNG, size limit) and persists an uploaded chat image. */
    StoredFile store(UUID conversationId, MultipartFile file);

    /** Reads back a previously stored file by its exact storage path (as persisted on the entity). */
    byte[] read(String storagePath);

    record StoredFile(String storagePath, String contentType, long sizeBytes) {
    }
}
