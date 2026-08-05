package com.hustlehub.reviews.controller;

import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.common.security.UserRole;
import com.hustlehub.reviews.dto.request.CreateReportRequest;
import com.hustlehub.reviews.dto.request.UpdateReportStatusRequest;
import com.hustlehub.reviews.dto.response.ReportResponse;
import com.hustlehub.reviews.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReportResponse createReport(@AuthenticationPrincipal AuthPrincipal principal,
                                        @Valid @RequestBody CreateReportRequest request) {
        return reportService.createReport(principal.id(), request);
    }

    @GetMapping("/admin")
    public List<ReportResponse> getAllForAdmin(@AuthenticationPrincipal AuthPrincipal principal,
                                                @RequestParam(required = false) String status) {
        requireAdmin(principal);
        return reportService.getAllForAdmin(status);
    }

    @PatchMapping("/admin/{id}")
    public ReportResponse updateStatus(@AuthenticationPrincipal AuthPrincipal principal,
                                        @PathVariable UUID id,
                                        @Valid @RequestBody UpdateReportStatusRequest request) {
        requireAdmin(principal);
        return reportService.updateStatus(id, request);
    }

    // Every /api/reports/admin/** route needs this - a normal student JWT authenticates fine
    // (SecurityConfig only requires "some valid JWT"), so role is checked here explicitly, same
    // style as InternalUserController's requireInternalKey.
    private void requireAdmin(AuthPrincipal principal) {
        if (principal.role() != UserRole.ADMIN) {
            throw new ForbiddenActionException("Admin access required");
        }
    }
}
