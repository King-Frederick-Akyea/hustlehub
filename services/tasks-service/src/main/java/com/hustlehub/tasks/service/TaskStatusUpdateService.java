package com.hustlehub.tasks.service;

import com.hustlehub.common.client.UserServiceClient;
import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.tasks.dto.response.TaskStatusUpdateResponse;
import com.hustlehub.tasks.entity.Task;
import com.hustlehub.tasks.entity.TaskStatus;
import com.hustlehub.tasks.entity.TaskStatusUpdate;
import com.hustlehub.tasks.exception.InvalidTaskStateException;
import com.hustlehub.tasks.repository.TaskRepository;
import com.hustlehub.tasks.repository.TaskStatusUpdateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskStatusUpdateService {

    private final TaskStatusUpdateRepository taskStatusUpdateRepository;
    private final TaskRepository taskRepository;
    private final UserServiceClient userServiceClient;

    @Transactional
    public TaskStatusUpdateResponse postUpdate(UUID currentUserId, UUID taskId, String note) {
        Task task = findTaskOrThrow(taskId);
        requirePosterOrAssignedTasker(task, currentUserId);
        if (task.getStatus() != TaskStatus.IN_PROGRESS) {
            throw new InvalidTaskStateException("Status updates are only allowed while a task is in progress");
        }
        TaskStatusUpdate update = TaskStatusUpdate.builder()
                .task(task)
                .authorId(currentUserId)
                .note(note.trim())
                .build();
        update = taskStatusUpdateRepository.save(update);
        UserSummaryResponse author = userServiceClient.getSummary(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserId));
        return TaskStatusUpdateResponse.from(update, author);
    }

    public List<TaskStatusUpdateResponse> getUpdates(UUID currentUserId, UUID taskId) {
        Task task = findTaskOrThrow(taskId);
        requirePosterOrAssignedTasker(task, currentUserId);
        List<TaskStatusUpdate> updates = taskStatusUpdateRepository.findByTaskOrderByCreatedAtAsc(task);
        Map<UUID, UserSummaryResponse> summaries = resolveSummaries(updates);
        return updates.stream()
                .map(update -> TaskStatusUpdateResponse.from(update, summaries.get(update.getAuthorId())))
                .toList();
    }

    private Task findTaskOrThrow(UUID id) {
        return taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    private void requirePosterOrAssignedTasker(Task task, UUID userId) {
        boolean isPoster = task.getPosterId().equals(userId);
        boolean isAssignedTasker = task.getAssignedTaskerId() != null && task.getAssignedTaskerId().equals(userId);
        if (!isPoster && !isAssignedTasker) {
            throw new ForbiddenActionException("Only the poster or assigned tasker can access status updates for this task");
        }
    }

    private Map<UUID, UserSummaryResponse> resolveSummaries(List<TaskStatusUpdate> updates) {
        Set<UUID> ids = new HashSet<>();
        for (TaskStatusUpdate update : updates) {
            ids.add(update.getAuthorId());
        }
        return userServiceClient.getSummaries(ids).stream()
                .collect(Collectors.toMap(UserSummaryResponse::id, s -> s));
    }
}
