package com.hustlehub.reviews.repository;

import com.hustlehub.reviews.entity.Report;
import com.hustlehub.reviews.entity.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID> {

    List<Report> findAllByOrderByCreatedAtDesc();

    List<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status);

    List<Report> findByReportedUserIdOrderByCreatedAtDesc(UUID reportedUserId);

    List<Report> findByReporterIdOrderByCreatedAtDesc(UUID reporterId);
}
