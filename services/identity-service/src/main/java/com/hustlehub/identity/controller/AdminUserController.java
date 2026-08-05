package com.hustlehub.identity.controller;

import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.common.security.UserRole;
import com.hustlehub.identity.dto.request.SuspendUserRequest;
import com.hustlehub.identity.dto.response.UserResponse;
import com.hustlehub.identity.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** Every route here requires role == ADMIN (see AdminAuthController for how that token is minted) - checked inline, same style as InternalUserController's requireInternalKey. */
@RestController
@RequestMapping("/api/users/admin")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public List<UserResponse> listUsers(@AuthenticationPrincipal AuthPrincipal principal) {
        requireAdmin(principal);
        return adminUserService.listUsers();
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        requireAdmin(principal);
        return adminUserService.getUser(id);
    }

    @GetMapping("/{id}/documents/{type}")
    public ResponseEntity<byte[]> getDocument(@AuthenticationPrincipal AuthPrincipal principal,
                                               @PathVariable UUID id, @PathVariable String type) {
        requireAdmin(principal);
        AdminUserService.DocumentData document = adminUserService.getDocument(id, type);
        MediaType contentType = "image/png".equalsIgnoreCase(document.contentType()) ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
        return ResponseEntity.ok().contentType(contentType).body(document.data());
    }

    @PostMapping("/{id}/verify")
    public UserResponse verify(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        requireAdmin(principal);
        return adminUserService.verify(id);
    }

    @PostMapping("/{id}/unverify")
    public UserResponse unverify(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        requireAdmin(principal);
        return adminUserService.unverify(id);
    }

    @PostMapping("/{id}/suspend")
    public UserResponse suspend(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id,
                                 @Valid @RequestBody SuspendUserRequest request) {
        requireAdmin(principal);
        return adminUserService.suspend(id, request.reason().trim());
    }

    @PostMapping("/{id}/unsuspend")
    public UserResponse unsuspend(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        requireAdmin(principal);
        return adminUserService.unsuspend(id);
    }

    private void requireAdmin(AuthPrincipal principal) {
        if (principal.role() != UserRole.ADMIN) {
            throw new ForbiddenActionException("Admin access required");
        }
    }
}
