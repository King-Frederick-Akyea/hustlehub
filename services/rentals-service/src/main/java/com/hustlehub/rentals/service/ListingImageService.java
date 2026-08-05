package com.hustlehub.rentals.service;

import com.hustlehub.common.exception.InvalidRequestException;
import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.rentals.entity.Listing;
import com.hustlehub.rentals.entity.ListingImage;
import com.hustlehub.rentals.repository.ListingImageRepository;
import com.hustlehub.rentals.service.storage.ListingImageStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ListingImageService {

    /** Enough to show a listing from a few angles without turning this into a photo album. */
    private static final int MAX_IMAGES_PER_LISTING = 6;

    private final ListingImageRepository listingImageRepository;
    private final ListingService listingService;
    private final ListingImageStorageService storageService;

    @Transactional
    public List<String> addImage(UUID listingId, UUID currentUserId, MultipartFile file) {
        Listing listing = listingService.findListingOrThrow(listingId);
        listingService.requireOwner(listing, currentUserId);

        long existingCount = listingImageRepository.countByListing(listing);
        if (existingCount >= MAX_IMAGES_PER_LISTING) {
            throw new InvalidRequestException("A listing can have at most " + MAX_IMAGES_PER_LISTING + " photos");
        }

        ListingImageStorageService.StoredFile stored = storageService.store(listingId, file);
        listingImageRepository.save(ListingImage.builder()
                .listing(listing)
                .storagePath(stored.storagePath())
                .contentType(stored.contentType())
                .sortOrder((int) existingCount)
                .build());

        return imageUrls(listing);
    }

    @Transactional
    public List<String> deleteImage(UUID listingId, UUID imageId, UUID currentUserId) {
        Listing listing = listingService.findListingOrThrow(listingId);
        listingService.requireOwner(listing, currentUserId);
        ListingImage image = findOwnedImage(listing, imageId);

        listingImageRepository.delete(image);
        storageService.delete(image.getStoragePath());

        return imageUrls(listing);
    }

    public ImageData readImage(UUID listingId, UUID imageId) {
        Listing listing = listingService.findListingOrThrow(listingId);
        ListingImage image = findOwnedImage(listing, imageId);
        return new ImageData(storageService.read(image.getStoragePath()), image.getContentType());
    }

    private List<String> imageUrls(Listing listing) {
        return urlsFor(listingImageRepository, listing);
    }

    /**
     * Static, not an instance call through this service - ListingService needs this to embed
     * image URLs in every ListingResponse it builds, but ListingService is itself a dependency
     * of this class (for the find/ownership helpers), so taking a full ListingImageService
     * dependency there would be a circular bean reference. A plain static helper over the
     * repository sidesteps that while keeping the URL-building logic in one place.
     */
    public static List<String> urlsFor(ListingImageRepository repository, Listing listing) {
        return repository.findByListingOrderBySortOrderAsc(listing).stream()
                .map(image -> "/api/listings/" + listing.getId() + "/images/" + image.getId())
                .toList();
    }

    private ListingImage findOwnedImage(Listing listing, UUID imageId) {
        ListingImage image = listingImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found"));
        if (!image.getListing().getId().equals(listing.getId())) {
            throw new ResourceNotFoundException("Image not found");
        }
        return image;
    }

    public record ImageData(byte[] data, String contentType) {
    }
}
