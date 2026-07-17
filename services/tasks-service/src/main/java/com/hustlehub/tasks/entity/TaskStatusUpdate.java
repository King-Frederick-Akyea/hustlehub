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
@Table(name = "task_status_updates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskStatusUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Same-domain relation (Task lives in this service too) — stays a real JPA relation.
    @ManyToOne(optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    // Cross-service reference (User lives in identity-service) — plain UUID column, no FK.
    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
