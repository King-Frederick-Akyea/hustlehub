package com.hustlehub.identity.controller;

import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.identity.dto.request.UpdateProfileRequest;
import com.hustlehub.identity.dto.response.PublicProfileResponse;
import com.hustlehub.identity.dto.response.UserResponse;
import com.hustlehub.identity.repository.UserRepository;
import com.hustlehub.identity.service.UserService;
import com.hustlehub.identity.service.storage.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.UncheckedIOException;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final UserService userService;

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AuthPrincipal principal) {
        return userService.getCurrentUser(principal.id());
    }

    @PatchMapping("/me")
    public UserResponse updateMe(@AuthenticationPrincipal AuthPrincipal principal,
                                  @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(principal.id(), request);
    }

    @PostMapping("/me/avatar")
    public UserResponse uploadAvatar(@AuthenticationPrincipal AuthPrincipal principal,
                                      @RequestParam("file") MultipartFile file) {
        return userService.uploadAvatar(principal.id(), file);
    }

    @GetMapping("/{id}")
    public PublicProfileResponse publicProfile(@PathVariable UUID id) {
        return userService.getPublicProfile(id);
    }

    @GetMapping("/{id}/avatar")
    public ResponseEntity<byte[]> avatar(@PathVariable UUID id) {
        var user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String path = user.getAvatarPath();
        if (path == null) {
            throw new ResourceNotFoundException("This user has no avatar");
        }
        byte[] data;
        try {
            data = fileStorageService.read(path);
        } catch (UncheckedIOException e) {
            // The DB row references a file that isn't on disk (e.g. lost/never-migrated upload) -
            // a 404 is the correct response here, not a 500 crash with a stack trace.
            throw new ResourceNotFoundException("This user's avatar file is missing");
        }
        MediaType contentType = path.toLowerCase(Locale.ROOT).endsWith(".png")
                ? MediaType.IMAGE_PNG
                : MediaType.IMAGE_JPEG;
        return ResponseEntity.ok().contentType(contentType).body(data);
    }
}
