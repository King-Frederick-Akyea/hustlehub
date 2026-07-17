package com.hustlehub.tasks.controller;

import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.tasks.dto.request.PostStatusUpdateRequest;
import com.hustlehub.tasks.dto.response.TaskStatusUpdateResponse;
import com.hustlehub.tasks.service.TaskStatusUpdateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskStatusUpdateController {

    private final TaskStatusUpdateService taskStatusUpdateService;

    @PostMapping("/{id}/status-updates")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskStatusUpdateResponse postStatusUpdate(@AuthenticationPrincipal AuthPrincipal principal,
                                                       @PathVariable UUID id,
                                                       @Valid @RequestBody PostStatusUpdateRequest request) {
        return taskStatusUpdateService.postUpdate(principal.id(), id, request.note());
    }

    @GetMapping("/{id}/status-updates")
    public List<TaskStatusUpdateResponse> getStatusUpdates(@AuthenticationPrincipal AuthPrincipal principal,
                                                             @PathVariable UUID id) {
        return taskStatusUpdateService.getUpdates(principal.id(), id);
    }
}
