package com.hustlehub.tasks.repository;

import com.hustlehub.tasks.entity.Task;
import com.hustlehub.tasks.entity.TaskStatusUpdate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskStatusUpdateRepository extends JpaRepository<TaskStatusUpdate, UUID> {

    List<TaskStatusUpdate> findByTaskOrderByCreatedAtAsc(Task task);
}
