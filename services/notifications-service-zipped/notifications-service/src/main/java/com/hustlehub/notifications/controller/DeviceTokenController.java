package com.hustlehub.notifications.controller;

import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.notifications.dto.DeviceTokenRequest;
import com.hustlehub.notifications.entity.DeviceToken;
import com.hustlehub.notifications.repository.DeviceTokenRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications/tokens")
@RequiredArgsConstructor
public class DeviceTokenController {

    private final DeviceTokenRepository deviceTokenRepository;

    // Upsert by token, not by userId - a device re-registering under a different user (logout,
    // login as someone else on the same phone) should move the token to the new owner, not create
    // a second row.
    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void register(@Valid @RequestBody DeviceTokenRequest request, @AuthenticationPrincipal AuthPrincipal principal) {
        DeviceToken token = deviceTokenRepository.findByExpoPushToken(request.expoPushToken())
                .orElseGet(() -> DeviceToken.builder().expoPushToken(request.expoPushToken()).build());
        token.setUserId(principal.id());
        deviceTokenRepository.save(token);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unregister(@Valid @RequestBody DeviceTokenRequest request) {
        deviceTokenRepository.deleteByExpoPushToken(request.expoPushToken());
    }
}
