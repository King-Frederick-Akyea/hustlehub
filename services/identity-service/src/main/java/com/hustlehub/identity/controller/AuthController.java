package com.hustlehub.identity.controller;

import com.hustlehub.identity.dto.request.ForgotPasswordRequest;
import com.hustlehub.identity.dto.request.LoginRequest;
import com.hustlehub.identity.dto.request.RefreshTokenRequest;
import com.hustlehub.identity.dto.request.RegisterRequest;
import com.hustlehub.identity.dto.request.ResetPasswordRequest;
import com.hustlehub.identity.dto.response.AuthResponse;
import com.hustlehub.identity.dto.response.ForgotPasswordResponse;
import com.hustlehub.identity.dto.response.MessageResponse;
import com.hustlehub.identity.dto.response.TokenPairResponse;
import com.hustlehub.identity.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public TokenPairResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.refreshToken());
    }

    @PostMapping("/forgot-password")
    public ForgotPasswordResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request.email());
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request.token(), request.newPassword());
    }
}
