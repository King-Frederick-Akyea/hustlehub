package com.hustlehub.tasks.entity;

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

@Entity
@Table(name = "task_bookmarks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskBookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Cross-service reference (User lives in identity-service) — plain UUID column, no FK.
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    // Same-domain relation (Task lives in this service too) — stays a real JPA relation.
    @ManyToOne(optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
