package com.hustlehub.identity.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        @Size(max = 254)
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must be at least 8 characters")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Password must contain at least one letter and one number")
        String password,

        @NotBlank(message = "Role is required")
        @Pattern(regexp = "poster|tasker|both", message = "Role must be one of: poster, tasker, both")
        String role
) {
}
