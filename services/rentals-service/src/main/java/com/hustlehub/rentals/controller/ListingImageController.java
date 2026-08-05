package com.hustlehub.rentals.controller;

import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.rentals.service.ListingImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/listings/{listingId}/images")
@RequiredArgsConstructor
public class ListingImageController {

    private final ListingImageService listingImageService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public List<String> addImage(@AuthenticationPrincipal AuthPrincipal principal,
                                  @PathVariable UUID listingId,
                                  @RequestParam("file") MultipartFile file) {
        return listingImageService.addImage(listingId, principal.id(), file);
    }

    @DeleteMapping("/{imageId}")
    public List<String> deleteImage(@AuthenticationPrincipal AuthPrincipal principal,
                                     @PathVariable UUID listingId,
                                     @PathVariable UUID imageId) {
        return listingImageService.deleteImage(listingId, imageId, principal.id());
    }

    // Public (no JWT) - see SecurityConfig. Rendered by React Native's <Image>, same as
    // identity-service's /api/users/*/avatar.
    @GetMapping("/{imageId}")
    public ResponseEntity<byte[]> getImage(@PathVariable UUID listingId, @PathVariable UUID imageId) {
        ListingImageService.ImageData image = listingImageService.readImage(listingId, imageId);
        MediaType contentType = "image/png".equals(image.contentType()) ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
        return ResponseEntity.ok().contentType(contentType).body(image.data());
    }
}
