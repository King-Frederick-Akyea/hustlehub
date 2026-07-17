package com.hustlehub.tasks.controller;

import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.tasks.dto.response.TaskResponse;
import com.hustlehub.tasks.service.TaskBookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskBookmarkController {

    private final TaskBookmarkService taskBookmarkService;

    @PostMapping("/{id}/bookmark")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void bookmarkTask(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        taskBookmarkService.addBookmark(principal.id(), id);
    }

    @DeleteMapping("/{id}/bookmark")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unbookmarkTask(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        taskBookmarkService.removeBookmark(principal.id(), id);
    }

    @GetMapping("/{id}/bookmark")
    public Map<String, Boolean> getBookmarkStatus(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        return Map.of("bookmarked", taskBookmarkService.isBookmarked(principal.id(), id));
    }

    @GetMapping("/bookmarks")
    public List<TaskResponse> getBookmarkedTasks(@AuthenticationPrincipal AuthPrincipal principal) {
        return taskBookmarkService.getBookmarkedTasks(principal.id());
    }
}
