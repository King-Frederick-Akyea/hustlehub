package com.hustlehub.tasks.controller;

import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.tasks.dto.request.PlaceBidRequest;
import com.hustlehub.tasks.dto.response.BidResponse;
import com.hustlehub.tasks.dto.response.TaskResponse;
import com.hustlehub.tasks.service.BidService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class BidController {

    private final BidService bidService;

    @PostMapping("/api/tasks/{taskId}/bids")
    @ResponseStatus(HttpStatus.CREATED)
    public BidResponse placeBid(@AuthenticationPrincipal AuthPrincipal principal,
                                 @PathVariable UUID taskId,
                                 @Valid @RequestBody PlaceBidRequest request) {
        return bidService.placeBid(taskId, principal.id(), request);
    }

    @GetMapping("/api/tasks/{taskId}/bids")
    public List<BidResponse> getBidsForTask(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID taskId) {
        return bidService.getBidsForTask(taskId, principal.id());
    }

    @PostMapping("/api/bids/{bidId}/accept")
    public TaskResponse acceptBid(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID bidId) {
        return bidService.acceptBid(bidId, principal.id());
    }

    @PostMapping("/api/bids/{bidId}/withdraw")
    public BidResponse withdrawBid(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID bidId) {
        return bidService.withdrawBid(bidId, principal.id());
    }
}
