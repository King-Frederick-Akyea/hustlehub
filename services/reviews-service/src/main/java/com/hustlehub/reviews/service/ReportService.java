package com.hustlehub.reviews.service;

import com.hustlehub.common.client.UserServiceClient;
import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.common.exception.InvalidRequestException;
import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.reviews.dto.request.CreateReportRequest;
import com.hustlehub.reviews.dto.request.UpdateReportStatusRequest;
import com.hustlehub.reviews.dto.response.ReportResponse;
import com.hustlehub.reviews.entity.Report;
import com.hustlehub.reviews.entity.ReportReasonCategory;
import com.hustlehub.reviews.entity.ReportStatus;
import com.hustlehub.reviews.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserServiceClient userServiceClient;

    @Transactional
    public ReportResponse createReport(UUID reporterId, CreateReportRequest request) {
        if (reporterId.equals(request.reportedUserId())) {
            throw new InvalidRequestException("You cannot report yourself");
        }
        // Confirms the reported user actually exists before filing anything against them.
        userServiceClient.getSummary(request.reportedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Report report = reportRepository.save(Report.builder()
                .reporterId(reporterId)
                .reportedUserId(request.reportedUserId())
                .reasonCategory(ReportReasonCategory.fromJson(request.reasonCategory()))
                .description(request.description().trim())
                .build());

        return toResponse(report);
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> getAllForAdmin(String status) {
        List<Report> reports = status != null
                ? reportRepository.findByStatusOrderByCreatedAtDesc(ReportStatus.fromJson(status))
                : reportRepository.findAllByOrderByCreatedAtDesc();
        return reports.stream().map(this::toResponse).toList();
    }

    @Transactional
    public ReportResponse updateStatus(UUID reportId, UpdateReportStatusRequest request) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        report.setStatus(ReportStatus.fromJson(request.status()));
        report.setAdminNote(request.adminNote() != null ? request.adminNote().trim() : null);
        report.setResolvedAt(Instant.now());
        reportRepository.save(report);
        return toResponse(report);
    }

    private ReportResponse toResponse(Report report) {
        UserSummaryResponse reporter = userServiceClient.getSummary(report.getReporterId()).orElse(null);
        UserSummaryResponse reportedUser = userServiceClient.getSummary(report.getReportedUserId()).orElse(null);
        return ReportResponse.from(report, reporter, reportedUser);
    }
}
