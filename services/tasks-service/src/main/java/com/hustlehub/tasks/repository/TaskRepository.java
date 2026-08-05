package com.hustlehub.tasks.repository;

import com.hustlehub.tasks.entity.Task;
import com.hustlehub.tasks.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findByPosterIdOrderByCreatedAtDesc(UUID posterId);

    List<Task> findByAssignedTaskerIdOrderByCreatedAtDesc(UUID assignedTaskerId);

    // Used by profile stats (completed-tasks count / total earnings) — kept here so the
    // task-feature and profile-feature work don't both need to edit this file.
    long countByAssignedTaskerIdAndStatus(UUID assignedTaskerId, TaskStatus status);

    @Query("select coalesce(sum(t.finalPrice), 0) from Task t where t.assignedTaskerId = :taskerId and t.status = :status")
    BigDecimal sumFinalPriceByAssignedTaskerAndStatus(@Param("taskerId") UUID taskerId, @Param("status") TaskStatus status);

    // Used to build the reviews-service "eligible to review" list — every completed task this
    // user was either side of (poster or tasker).
    List<Task> findByPosterIdAndStatus(UUID posterId, TaskStatus status);

    List<Task> findByAssignedTaskerIdAndStatus(UUID assignedTaskerId, TaskStatus status);

    // Category/search filtering happens in TaskService (in-memory) rather than as optional JPQL
    // parameters here — binding a null String/enum through "(:x is null or ...)" tripped Postgres's
    // JDBC type inference (it guessed `bytea` for the untyped null, e.g. "function lower(bytea) does
    // not exist"). Simpler and just as correct at this app's scale to filter the fetched list in Java.
    List<Task> findByStatusAndPosterIdNotOrderByCreatedAtDesc(TaskStatus status, UUID excludePosterId);

    /**
     * Concurrency-safe instant self-assign: only succeeds (returns 1) if the task is still
     * unclaimed. {@code clearAutomatically = true} is required — without it, a Task already
     * loaded earlier in the same transaction (e.g. the ownership check in
     * TaskService.acceptTask) stays cached in Hibernate's persistence context, so a subsequent
     * re-fetch by id returns that stale pre-update instance instead of hitting the database,
     * and {@code assignedTaskerId} reads back null even though the row was updated correctly.
     * Confirmed by hitting exactly this bug end-to-end (surfaced as a 503 from
     * UserServiceClient.getSummary(null) when resolving the "assigned tasker" summary).
     */
    @Modifying(clearAutomatically = true)
    @Query("update Task t set t.status = com.hustlehub.tasks.entity.TaskStatus.IN_PROGRESS, "
            + "t.assignedTaskerId = :taskerId, t.finalPrice = t.budget "
            + "where t.id = :taskId and t.status = com.hustlehub.tasks.entity.TaskStatus.OPEN and t.assignedTaskerId is null")
    int claimTaskAtListedPrice(@Param("taskId") UUID taskId, @Param("taskerId") UUID taskerId);

    /** Used when a poster accepts a specific bid instead of the listed price. Same staleness reasoning as above. */
    @Modifying(clearAutomatically = true)
    @Query("update Task t set t.status = com.hustlehub.tasks.entity.TaskStatus.IN_PROGRESS, "
            + "t.assignedTaskerId = :taskerId, t.finalPrice = :price "
            + "where t.id = :taskId and t.status = com.hustlehub.tasks.entity.TaskStatus.OPEN and t.assignedTaskerId is null")
    int assignToBidder(@Param("taskId") UUID taskId, @Param("taskerId") UUID taskerId, @Param("price") BigDecimal price);
}
