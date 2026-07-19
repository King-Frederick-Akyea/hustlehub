package com.hustlehub.notifications.controller;

import com.hustlehub.common.config.InternalApiProperties;
import com.hustlehub.common.dto.NotifySendRequest;
import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.notifications.service.NotificationSendService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Implements common's NotificationsServiceClient contract for other services. Not reachable by end
 * users - protected by a shared internal key instead of a user JWT, checked here in the controller
 * (see SecurityConfig, which permits this path without authentication). Mirrors payments-service's
 * InternalPaymentsController exactly.
 */
@RestController
@RequestMapping("/internal/notifications")
@RequiredArgsConstructor
public class InternalNotificationController {

    private final NotificationSendService notificationSendService;
    private final InternalApiProperties internalApiProperties;

    @PostMapping("/send")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void send(@RequestBody NotifySendRequest request,
                      @RequestHeader(value = InternalApiProperties.HEADER_NAME, required = false) String key) {
        requireInternalKey(key);
        notificationSendService.send(request);
    }

    private void requireInternalKey(String provided) {
        if (provided == null || !internalApiProperties.getKey().equals(provided)) {
            throw new ForbiddenActionException("Invalid internal API key");
        }
    }
}
