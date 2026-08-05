package com.hustlehub.messaging.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * {@code conversation} stays a real {@code @ManyToOne} — conversations and messages are both
 * owned by this same service, unlike the sender, which lives in identity-service and is
 * therefore a plain UUID column (see {@link Conversation}).
 */
@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    /** Nullable — a message can be image-only. At least one of text/imagePath is always set (DB check constraint). */
    @Column(columnDefinition = "TEXT")
    private String text;

    @Column(name = "image_path", length = 500)
    private String imagePath;

    @Column(name = "image_content_type", length = 20)
    private String imageContentType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "read_at")
    private Instant readAt;
}
