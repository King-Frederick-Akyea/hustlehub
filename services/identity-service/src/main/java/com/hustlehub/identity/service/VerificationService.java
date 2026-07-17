package com.hustlehub.identity.service;

import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.identity.dto.response.ResendVerificationResponse;
import com.hustlehub.identity.entity.EmailVerificationCode;
import com.hustlehub.identity.entity.User;
import com.hustlehub.identity.entity.VerificationDocument;
import com.hustlehub.identity.entity.VerificationDocumentType;
import com.hustlehub.identity.entity.VerificationStatus;
import com.hustlehub.identity.exception.InvalidVerificationCodeException;
import com.hustlehub.identity.exception.TooManyAttemptsException;
import com.hustlehub.identity.repository.EmailVerificationCodeRepository;
import com.hustlehub.identity.repository.UserRepository;
import com.hustlehub.identity.repository.VerificationDocumentRepository;
import com.hustlehub.identity.service.email.EmailService;
import com.hustlehub.identity.service.storage.FileStorageService;
import com.hustlehub.identity.util.CryptoUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VerificationService {

    private static final Logger log = LoggerFactory.getLogger(VerificationService.class);

    private static final Duration CODE_VALIDITY = Duration.ofMinutes(10);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final int MAX_ATTEMPTS = 5;

    private final EmailVerificationCodeRepository emailVerificationCodeRepository;
    private final VerificationDocumentRepository verificationDocumentRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final FileStorageService fileStorageService;

    @Value("${app.mail.dev-echo-enabled:false}")
    private boolean devEchoEnabled;

    @Transactional
    public void issueEmailVerificationCode(User user) {
        String code = CryptoUtils.generateOtp();
        EmailVerificationCode entity = EmailVerificationCode.builder()
                .user(user)
                .codeHash(CryptoUtils.sha256Hex(code))
                .expiresAt(Instant.now().plus(CODE_VALIDITY))
                .build();
        emailVerificationCodeRepository.save(entity);
        sendVerificationCodeSafely(user, code);
    }

    @Transactional
    public ResendVerificationResponse resendVerificationCode(UUID userId) {
        User user = findUserOrThrow(userId);
        Optional<EmailVerificationCode> latest =
                emailVerificationCodeRepository.findFirstByUserAndConsumedAtIsNullOrderByCreatedAtDesc(user);
        if (latest.isPresent() && latest.get().getCreatedAt().isAfter(Instant.now().minus(RESEND_COOLDOWN))) {
            throw new TooManyAttemptsException("Please wait before requesting another code");
        }

        String code = CryptoUtils.generateOtp();
        EmailVerificationCode entity = EmailVerificationCode.builder()
                .user(user)
                .codeHash(CryptoUtils.sha256Hex(code))
                .expiresAt(Instant.now().plus(CODE_VALIDITY))
                .build();
        emailVerificationCodeRepository.save(entity);
        sendVerificationCodeSafely(user, code);

        return new ResendVerificationResponse(
                "A new verification code has been sent",
                devEchoEnabled ? code : null);
    }

    /**
     * The OTP is already persisted regardless of delivery outcome (dev-echo/resend still work),
     * so a broken email provider must never fail registration or block the request — log and move on.
     */
    private void sendVerificationCodeSafely(User user, String code) {
        try {
            emailService.sendVerificationCode(user, code);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}", user.getEmail(), e);
        }
    }

    @Transactional
    public User verifyEmail(UUID userId, String code) {
        User user = findUserOrThrow(userId);
        EmailVerificationCode entity = emailVerificationCodeRepository
                .findFirstByUserAndConsumedAtIsNullOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new InvalidVerificationCodeException("No verification code found. Please request a new one."));

        if (entity.isExpired()) {
            throw new InvalidVerificationCodeException("This code has expired. Please request a new one.");
        }
        if (entity.getAttemptCount() >= MAX_ATTEMPTS) {
            throw new TooManyAttemptsException("Too many incorrect attempts. Please request a new code.");
        }
        if (!entity.getCodeHash().equals(CryptoUtils.sha256Hex(code))) {
            entity.setAttemptCount(entity.getAttemptCount() + 1);
            emailVerificationCodeRepository.save(entity);
            throw new InvalidVerificationCodeException("Incorrect code");
        }

        entity.setConsumedAt(Instant.now());
        emailVerificationCodeRepository.save(entity);

        if (user.getVerificationStatus() == VerificationStatus.PENDING) {
            user.setVerificationStatus(VerificationStatus.EMAIL_VERIFIED);
            userRepository.save(user);
        }
        return user;
    }

    /**
     * No automated ID/face matching — the image is stored for possible later review, and the
     * user is moved straight through verification so they're never blocked waiting on anyone.
     */
    @Transactional
    public User uploadStudentId(UUID userId, MultipartFile file) {
        User user = findUserOrThrow(userId);
        FileStorageService.StoredFile stored = fileStorageService.store(user.getId(), VerificationDocumentType.STUDENT_ID, file);
        saveDocument(user, VerificationDocumentType.STUDENT_ID, stored);

        if (user.getVerificationStatus() != VerificationStatus.FULLY_VERIFIED) {
            user.setVerificationStatus(VerificationStatus.ID_SUBMITTED);
            userRepository.save(user);
        }
        return user;
    }

    /** Face photo is the last verification step: capturing it auto-completes verification. */
    @Transactional
    public User uploadFacePhoto(UUID userId, MultipartFile file) {
        User user = findUserOrThrow(userId);
        FileStorageService.StoredFile stored = fileStorageService.store(user.getId(), VerificationDocumentType.FACE_PHOTO, file);
        saveDocument(user, VerificationDocumentType.FACE_PHOTO, stored);

        user.setVerificationStatus(VerificationStatus.FULLY_VERIFIED);
        userRepository.save(user);
        return user;
    }

    private void saveDocument(User user, VerificationDocumentType type, FileStorageService.StoredFile stored) {
        VerificationDocument document = VerificationDocument.builder()
                .user(user)
                .type(type)
                .storagePath(stored.storagePath())
                .originalFilename(stored.originalFilename())
                .contentType(stored.contentType())
                .fileSizeBytes(stored.sizeBytes())
                .build();
        verificationDocumentRepository.save(document);
    }

    private User findUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
