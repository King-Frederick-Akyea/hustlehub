package com.hustlehub.reviews.dto.response;

import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.reviews.entity.Report;

import java.time.Instant;
import java.util.UUID;

public record ReportResponse(
        UUID id,
        UUID reporterId,
        UserSummaryResponse reporter,
        UUID reportedUserId,
        UserSummaryResponse reportedUser,
        String reasonCategory,
        String description,
        String status,
        String adminNote,
        Instant createdAt,
        Instant resolvedAt
) {
    public static ReportResponse from(Report report, UserSummaryResponse reporter, UserSummaryResponse reportedUser) {
        return new ReportResponse(
                report.getId(),
                report.getReporterId(),
                reporter,
                report.getReportedUserId(),
                reportedUser,
                report.getReasonCategory().toJson(),
                report.getDescription(),
                report.getStatus().toJson(),
                report.getAdminNote(),
                report.getCreatedAt(),
                report.getResolvedAt()
        );
    }
}
