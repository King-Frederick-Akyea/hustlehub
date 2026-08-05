package com.hustlehub.identity.entity;

import com.hustlehub.common.security.UserRole;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 30)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(length = 280)
    private String bio;

    @Column(name = "avatar_path", length = 500)
    private String avatarPath;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false, length = 10)
    @Builder.Default
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @Column(name = "suspension_reason", columnDefinition = "TEXT")
    private String suspensionReason;

    @Column(name = "suspended_at")
    private Instant suspendedAt;

    /** Admin-granted trust badge — distinct from {@code verificationStatus}, which auto-completes with no human review. See VerificationService. */
    @Column(name = "admin_verified", nullable = false)
    @Builder.Default
    private boolean adminVerified = false;

    @Column(name = "admin_verified_at")
    private Instant adminVerifiedAt;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(length = 200)
    private String availability;

    /** Values are TASK_CATEGORIES ids from the frontend, not a free-standing taxonomy. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_specializations", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "value")
    @Builder.Default
    private Set<String> specializations = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public boolean isEmailVerified() {
        return verificationStatus != VerificationStatus.PENDING;
    }

    public boolean isSuspended() {
        return accountStatus == AccountStatus.SUSPENDED;
    }
}
