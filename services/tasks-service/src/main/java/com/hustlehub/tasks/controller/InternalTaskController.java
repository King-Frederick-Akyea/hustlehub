package com.hustlehub.tasks.controller;

import com.hustlehub.common.config.InternalApiProperties;
import com.hustlehub.common.dto.CompletedEngagementResponse;
import com.hustlehub.common.dto.EngagementParticipantsResponse;
import com.hustlehub.common.dto.UserStatsResponse;
import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.tasks.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Resolves task-derived stats/eligibility for other services (via {@code common}'s
 * {@code TasksServiceClient}) — consumed by identity-service (profile stats) and reviews-service
 * (review eligibility). Not reachable by end users — protected by a shared internal key instead
 * of a user JWT, checked here (see SecurityConfig, which permits /internal/** without authentication).
 */
@RestController
@RequestMapping("/internal/tasks")
@RequiredArgsConstructor
public class InternalTaskController {

    private final TaskService taskService;
    private final InternalApiProperties internalApiProperties;

    @GetMapping("/stats/{userId}")
    public UserStatsResponse getStats(@PathVariable UUID userId,
                                       @RequestHeader(value = InternalApiProperties.HEADER_NAME, required = false) String key) {
        requireInternalKey(key);
        return taskService.getStats(userId);
    }

    @GetMapping("/completed-engagements/{userId}")
    public List<CompletedEngagementResponse> getCompletedEngagements(@PathVariable UUID userId,
                                                                       @RequestHeader(value = InternalApiProperties.HEADER_NAME, required = false) String key) {
        requireInternalKey(key);
        return taskService.getCompletedEngagements(userId);
    }

    @GetMapping("/{id}/participants")
    public EngagementParticipantsResponse getParticipants(@PathVariable UUID id,
                                                            @RequestHeader(value = InternalApiProperties.HEADER_NAME, required = false) String key) {
        requireInternalKey(key);
        return taskService.getParticipants(id).orElseThrow(() -> new ResourceNotFoundException("Task not found or never assigned"));
    }

    @PostMapping("/suspend-cleanup/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void suspendCleanup(@PathVariable UUID userId,
                                @RequestHeader(value = InternalApiProperties.HEADER_NAME, required = false) String key) {
        requireInternalKey(key);
        taskService.suspendCleanup(userId);
    }

    private void requireInternalKey(String provided) {
        if (provided == null || !internalApiProperties.getKey().equals(provided)) {
            throw new ForbiddenActionException("Invalid internal API key");
        }
    }
}
