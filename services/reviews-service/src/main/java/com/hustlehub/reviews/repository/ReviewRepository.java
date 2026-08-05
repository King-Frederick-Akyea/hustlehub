package com.hustlehub.reviews.repository;

import com.hustlehub.reviews.entity.EngagementType;
import com.hustlehub.reviews.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    List<Review> findByRevieweeIdOrderByCreatedAtDesc(UUID revieweeId);

    boolean existsByReviewerIdAndRelatedTypeAndRelatedId(UUID reviewerId, EngagementType relatedType, UUID relatedId);

    // Two simple scalar queries instead of one multi-column aggregate - a JPQL query selecting
    // multiple expressions and declared to return a plain Object[] here double-wraps under this
    // Hibernate version (getResultList() semantics leak through even for a guaranteed single row),
    // so row[0] turned out to be another Object[] rather than a Number, throwing a
    // ClassCastException on every call. Confirmed by hitting exactly that 500 end-to-end.
    @Query("select coalesce(avg(r.rating), 0.0) from Review r where r.revieweeId = :userId")
    double averageRatingFor(@Param("userId") UUID userId);

    long countByRevieweeId(UUID revieweeId);
}
