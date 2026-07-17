package com.hustlehub.identity.service.storage;

import com.hustlehub.identity.config.FileStorageProperties;
import com.hustlehub.identity.entity.VerificationDocumentType;
import com.hustlehub.identity.exception.UnsupportedFileTypeException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LocalFileStorageService implements FileStorageService {

    private static final Map<String, String> ALLOWED_CONTENT_TYPES = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png"
    );

    private final FileStorageProperties properties;

    @Override
    public StoredFile store(UUID userId, VerificationDocumentType type, MultipartFile file) {
        return storeInto(Path.of(properties.getBaseDir(), userId.toString(), type.name().toLowerCase()), file);
    }

    @Override
    public StoredFile storeAvatar(UUID userId, MultipartFile file) {
        return storeInto(Path.of(properties.getBaseDir(), userId.toString(), "avatar"), file);
    }

    @Override
    public byte[] read(String storagePath) {
        try {
            return Files.readAllBytes(Path.of(storagePath));
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read stored file", e);
        }
    }

    private StoredFile storeInto(Path dir, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new UnsupportedFileTypeException("No file was uploaded");
        }
        String contentType = file.getContentType();
        String extension = contentType != null ? ALLOWED_CONTENT_TYPES.get(contentType.toLowerCase()) : null;
        if (extension == null) {
            throw new UnsupportedFileTypeException("Only JPEG or PNG images are accepted");
        }
        if (file.getSize() > properties.getMaxFileSizeBytes()) {
            throw new UnsupportedFileTypeException("File exceeds the maximum allowed size");
        }

        try {
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "." + extension;
            Path destination = dir.resolve(filename);
            file.transferTo(destination);
            return new StoredFile(destination.toString(), file.getOriginalFilename(), contentType, file.getSize());
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store uploaded file", e);
        }
    }
}
