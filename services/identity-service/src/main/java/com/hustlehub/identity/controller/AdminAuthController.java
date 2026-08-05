package com.hustlehub.identity.controller;

import com.hustlehub.identity.config.AdminProperties;
import com.hustlehub.identity.dto.request.AdminLoginRequest;
import com.hustlehub.identity.dto.response.AdminAuthResponse;
import com.hustlehub.identity.exception.InvalidCredentialsException;
import com.hustlehub.identity.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The one hardcoded admin login (username/password from services/.env.properties), no admin_users table - see JwtService.generateAdminAccessToken. */
@RestController
@RequestMapping("/api/auth/admin")
@RequiredArgsConstructor
public class AdminAuthController {

    private static final long ADMIN_TOKEN_TTL_SECONDS = 12 * 3600L;

    private final AdminProperties adminProperties;
    private final JwtService jwtService;

    @PostMapping("/login")
    public AdminAuthResponse login(@Valid @RequestBody AdminLoginRequest request) {
        String expectedUsername = adminProperties.getUsername();
        String expectedPassword = adminProperties.getPassword();
        boolean valid = expectedUsername != null && expectedPassword != null
                && expectedUsername.equals(request.username())
                && expectedPassword.equals(request.password());
        if (!valid) {
            throw new InvalidCredentialsException();
        }
        return new AdminAuthResponse(jwtService.generateAdminAccessToken(), ADMIN_TOKEN_TTL_SECONDS);
    }
}
