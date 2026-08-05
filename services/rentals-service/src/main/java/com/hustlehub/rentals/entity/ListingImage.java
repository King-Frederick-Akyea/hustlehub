package com.hustlehub.rentals.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/** Up to 6 photos per listing (rental or barter - works the same for both), lowest sortOrder = cover/primary. */
@Entity
@Table(name = "listing_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    @Column(name = "content_type", nullable = false, length = 20)
    private String contentType;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
