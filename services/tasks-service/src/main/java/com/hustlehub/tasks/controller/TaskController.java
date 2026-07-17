package com.hustlehub.tasks.controller;

import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.tasks.dto.request.CreateTaskRequest;
import com.hustlehub.tasks.dto.response.TaskResponse;
import com.hustlehub.tasks.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse createTask(@AuthenticationPrincipal AuthPrincipal principal,
                                    @Valid @RequestBody CreateTaskRequest request) {
        return taskService.createTask(principal.id(), request);
    }

    @GetMapping
    public List<TaskResponse> browseOpenTasks(@AuthenticationPrincipal AuthPrincipal principal,
                                               @RequestParam(required = false) String category,
                                               @RequestParam(required = false) String search) {
        return taskService.getOpenTasks(principal.id(), category, search);
    }

    @GetMapping("/mine")
    public List<TaskResponse> myTasks(@AuthenticationPrincipal AuthPrincipal principal,
                                       @RequestParam(defaultValue = "posted") String role) {
        return taskService.getMyTasks(principal.id(), role);
    }

    @GetMapping("/{id}")
    public TaskResponse getTask(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        return taskService.getTask(id, principal.id());
    }

    @PostMapping("/{id}/accept")
    public TaskResponse acceptTask(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        return taskService.acceptTask(id, principal.id());
    }

    @PostMapping("/{id}/cancel")
    public TaskResponse cancelTask(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        return taskService.cancelTask(id, principal.id());
    }

    @PostMapping("/{id}/complete")
    public TaskResponse completeTask(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        return taskService.completeTask(id, principal.id());
    }
}
