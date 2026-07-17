package com.hustlehub.tasks.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.domain.Persistable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * {@code poster}/{@code assignedTasker} are plain UUID columns, not JPA relations — this service
 * has no {@code users} table (identity-service owns that). Resolve display info via
 * {@code UserServiceClient} at the response-building layer, not here.
 * <p>
 * The id is a plain application-assigned UUID (no {@code @GeneratedValue}) - {@code
 * TaskService.createTask} generates it up front, before the row exists, because it's needed to
 * call {@code paymentsServiceClient.hold} first (so a failed hold never creates a task). Pairing a
 * pre-set id with {@code @GeneratedValue(strategy = GenerationType.UUID)} confuses Hibernate's own
 * new-vs-detached detection independently of Spring Data: even after making this class implement
 * {@link Persistable} so {@code repository.save()} correctly dispatches to {@code persist()} for
 * brand-new instances, Hibernate's {@code persist()} itself still saw a generated-strategy id that
 * was already non-null and threw {@code PersistentObjectException: Detached entity passed to
 * persist} - confirmed by hitting exactly that 500 end-to-end. Dropping {@code @GeneratedValue}
 * removes the conflict: the id is simply "assigned", exactly like every other id we set ourselves.
 * <p>
 * Implements {@link Persistable} so {@code isNew()} governs the persist-vs-merge dispatch instead
 * of Spring Data's default id-null check (which would never fire now that we always set a non-null
 * id up front). {@code isNew} defaults to true for freshly built instances and flips to false via
 * {@code @PostLoad}/{@code @PostPersist}, so existing call sites that {@code save()} an entity
 * fetched via {@code findById} (cancelTask, completeTask) are unaffected - those are already
 * non-new and still go through {@code merge()} as before.
 */
@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task implements Persistable<UUID> {

    @Id
    private UUID id;

    @Transient
    @Builder.Default
    private boolean isNew = true;

    @Column(name = "poster_id", nullable = false)
    private UUID posterId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskCategory category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal budget;

    @Column(nullable = false, length = 255)
    private String location;

    private Double locationLat;
    private Double locationLng;

    @Column(name = "is_delivery", nullable = false)
    @Builder.Default
    private boolean delivery = false;

    @Column(name = "pickup_location", length = 255)
    private String pickupLocation;
    private Double pickupLat;
    private Double pickupLng;

    @Column(name = "dropoff_location", length = 255)
    private String dropoffLocation;
    private Double dropoffLat;
    private Double dropoffLng;

    @Column(nullable = false)
    private Instant deadline;

    @Column(name = "is_urgent", nullable = false)
    @Builder.Default
    private boolean urgent = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TaskStatus status = TaskStatus.OPEN;

    @Column(name = "assigned_tasker_id")
    private UUID assignedTaskerId;

    @Column(name = "final_price", precision = 10, scale = 2)
    private BigDecimal finalPrice;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Override
    public UUID getId() {
        return id;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        this.isNew = false;
    }
}
