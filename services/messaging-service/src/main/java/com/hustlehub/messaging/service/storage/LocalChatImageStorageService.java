package com.hustlehub.messaging.service.storage;

import com.hustlehub.common.exception.InvalidRequestException;
import com.hustlehub.messaging.config.UploadsProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

/** Same validation/layout approach as identity-service's LocalFileStorageService, scoped to this service's own uploads dir - no shared storage between services. */
@Service
@RequiredArgsConstructor
public class LocalChatImageStorageService implements ChatImageStorageService {

    private static final Map<String, String> ALLOWED_CONTENT_TYPES = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png"
    );

    private final UploadsProperties properties;

    @Override
    public StoredFile store(UUID conversationId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("No file was uploaded");
        }
        String contentType = file.getContentType();
        String extension = contentType != null ? ALLOWED_CONTENT_TYPES.get(contentType.toLowerCase()) : null;
        if (extension == null) {
            throw new InvalidRequestException("Only JPEG or PNG images are accepted");
        }
        if (file.getSize() > properties.getMaxFileSizeBytes()) {
            throw new InvalidRequestException("File exceeds the maximum allowed size");
        }

        try {
            Path dir = Path.of(properties.getBaseDir(), conversationId.toString());
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "." + extension;
            Path destination = dir.resolve(filename);
            file.transferTo(destination);
            return new StoredFile(destination.toString(), contentType, file.getSize());
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store uploaded file", e);
        }
    }

    @Override
    public byte[] read(String storagePath) {
        try {
            return Files.readAllBytes(Path.of(storagePath));
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read stored file", e);
        }
    }
}
