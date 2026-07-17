package com.hustlehub.identity.controller;

import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.identity.dto.request.VerifyEmailRequest;
import com.hustlehub.identity.dto.response.ResendVerificationResponse;
import com.hustlehub.identity.dto.response.UserResponse;
import com.hustlehub.identity.service.UserService;
import com.hustlehub.identity.service.VerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;
    private final UserService userService;

    @PostMapping("/email/verify")
    public Map<String, UserResponse> verifyEmail(@AuthenticationPrincipal AuthPrincipal principal,
                                                   @Valid @RequestBody VerifyEmailRequest request) {
        var user = verificationService.verifyEmail(principal.id(), request.code());
        return Map.of("user", userService.toResponse(user));
    }

    @PostMapping("/email/resend")
    public ResendVerificationResponse resend(@AuthenticationPrincipal AuthPrincipal principal) {
        return verificationService.resendVerificationCode(principal.id());
    }

    @PostMapping("/student-id")
    public Map<String, UserResponse> uploadStudentId(@AuthenticationPrincipal AuthPrincipal principal,
                                                       @RequestParam("file") MultipartFile file) {
        var user = verificationService.uploadStudentId(principal.id(), file);
        return Map.of("user", userService.toResponse(user));
    }

    @PostMapping("/face-photo")
    public Map<String, UserResponse> uploadFacePhoto(@AuthenticationPrincipal AuthPrincipal principal,
                                                       @RequestParam("file") MultipartFile file) {
        var user = verificationService.uploadFacePhoto(principal.id(), file);
        return Map.of("user", userService.toResponse(user));
    }
}
