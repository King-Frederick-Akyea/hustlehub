package com.hustlehub.tasks.repository;

import com.hustlehub.tasks.entity.Task;
import com.hustlehub.tasks.entity.TaskBookmark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskBookmarkRepository extends JpaRepository<TaskBookmark, UUID> {

    Optional<TaskBookmark> findByUserIdAndTask(UUID userId, Task task);

    List<TaskBookmark> findByUserIdOrderByCreatedAtDesc(UUID userId);

    boolean existsByUserIdAndTask(UUID userId, Task task);

    void deleteByUserIdAndTask(UUID userId, Task task);
}
