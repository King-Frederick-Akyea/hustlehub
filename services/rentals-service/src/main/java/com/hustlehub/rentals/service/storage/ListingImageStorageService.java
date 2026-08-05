package com.hustlehub.rentals.service.storage;

import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface ListingImageStorageService {

    /** Validates (JPEG/PNG, size limit) and persists an uploaded listing photo. */
    StoredFile store(UUID listingId, MultipartFile file);

    /** Reads back a previously stored file by its exact storage path (as persisted on the entity). */
    byte[] read(String storagePath);

    /** Best-effort delete of the file backing a removed image row - never throws. */
    void delete(String storagePath);

    record StoredFile(String storagePath, String contentType, long sizeBytes) {
    }
}
