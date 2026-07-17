package com.hustlehub.tasks.service;

import com.hustlehub.common.client.UserServiceClient;
import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.tasks.dto.response.TaskResponse;
import com.hustlehub.tasks.entity.Task;
import com.hustlehub.tasks.entity.TaskBookmark;
import com.hustlehub.tasks.repository.BidRepository;
import com.hustlehub.tasks.repository.TaskBookmarkRepository;
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
public class TaskBookmarkService {

    private final TaskBookmarkRepository taskBookmarkRepository;
    private final BidRepository bidRepository;
    private final TaskService taskService;
    private final UserServiceClient userServiceClient;

    @Transactional
    public void addBookmark(UUID userId, UUID taskId) {
        Task task = taskService.findTaskOrThrow(taskId);
        if (taskBookmarkRepository.existsByUserIdAndTask(userId, task)) {
            return;
        }
        TaskBookmark bookmark = TaskBookmark.builder()
                .userId(userId)
                .task(task)
                .build();
        taskBookmarkRepository.save(bookmark);
    }

    @Transactional
    public void removeBookmark(UUID userId, UUID taskId) {
        Task task = taskService.findTaskOrThrow(taskId);
        taskBookmarkRepository.deleteByUserIdAndTask(userId, task);
    }

    public boolean isBookmarked(UUID userId, UUID taskId) {
        Task task = taskService.findTaskOrThrow(taskId);
        return taskBookmarkRepository.existsByUserIdAndTask(userId, task);
    }

    public List<TaskResponse> getBookmarkedTasks(UUID userId) {
        List<Task> tasks = taskBookmarkRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(TaskBookmark::getTask)
                .toList();
        Map<UUID, UserSummaryResponse> summaries = resolveSummaries(tasks);
        return tasks.stream()
                .map(task -> TaskResponse.from(task, bidRepository.countByTask(task), null,
                        summaries.get(task.getPosterId()),
                        task.getAssignedTaskerId() == null ? null : summaries.get(task.getAssignedTaskerId())))
                .toList();
    }

    private Map<UUID, UserSummaryResponse> resolveSummaries(List<Task> tasks) {
        Set<UUID> ids = new HashSet<>();
        for (Task task : tasks) {
            ids.add(task.getPosterId());
            if (task.getAssignedTaskerId() != null) {
                ids.add(task.getAssignedTaskerId());
            }
        }
        return userServiceClient.getSummaries(ids).stream()
                .collect(Collectors.toMap(UserSummaryResponse::id, s -> s));
    }
}
