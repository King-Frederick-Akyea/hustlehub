package com.hustlehub.notifications.controller;

import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.notifications.dto.NotificationResponse;
import com.hustlehub.notifications.entity.Notification;
import com.hustlehub.notifications.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping("/api/notifications")
    public List<NotificationResponse> getMyNotifications(@AuthenticationPrincipal AuthPrincipal principal) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(principal.id()).stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @PatchMapping("/api/notifications/{id}/read")
    @Transactional
    public NotificationResponse markAsRead(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal principal) {
        Notification notification = notificationRepository.findByIdAndUserId(id, principal.id())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setRead(true);
        return NotificationResponse.from(notificationRepository.save(notification));
    }

    @PostMapping("/api/notifications/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void markAllAsRead(@AuthenticationPrincipal AuthPrincipal principal) {
        notificationRepository.markAllReadForUser(principal.id());
    }
}
