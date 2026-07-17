package com.hustlehub.tasks.service;

import com.hustlehub.common.client.NotificationsServiceClient;
import com.hustlehub.common.client.PaymentsServiceClient;
import com.hustlehub.common.client.UserServiceClient;
import com.hustlehub.common.dto.NotificationType;
import com.hustlehub.common.dto.TransferResult;
import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.common.exception.InvalidRequestException;
import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.tasks.dto.request.PlaceBidRequest;
import com.hustlehub.tasks.dto.response.BidResponse;
import com.hustlehub.tasks.dto.response.TaskResponse;
import com.hustlehub.tasks.entity.Bid;
import com.hustlehub.tasks.entity.BidStatus;
import com.hustlehub.tasks.entity.Task;
import com.hustlehub.tasks.entity.TaskStatus;
import com.hustlehub.tasks.exception.InvalidTaskStateException;
import com.hustlehub.tasks.exception.TaskAlreadyAssignedException;
import com.hustlehub.tasks.repository.BidRepository;
import com.hustlehub.tasks.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BidService {

    private final BidRepository bidRepository;
    private final TaskRepository taskRepository;
    private final TaskService taskService;
    private final UserServiceClient userServiceClient;
    private final PaymentsServiceClient paymentsServiceClient;
    private final NotificationsServiceClient notificationsServiceClient;

    @Transactional
    public BidResponse placeBid(UUID taskId, UUID taskerId, PlaceBidRequest request) {
        Task task = taskService.findTaskOrThrow(taskId);
        if (task.getPosterId().equals(taskerId)) {
            throw new ForbiddenActionException("You cannot bid on your own task");
        }
        if (task.getStatus() != TaskStatus.OPEN) {
            throw new InvalidTaskStateException("This task is no longer accepting bids");
        }

        Optional<Bid> existingPending = bidRepository.findByTaskAndTaskerId(task, taskerId).stream()
                .filter(b -> b.getStatus() == BidStatus.PENDING)
                .findFirst();

        Bid bid = existingPending.orElseGet(() -> Bid.builder().task(task).taskerId(taskerId).build());
        bid.setAmount(request.amount());
        bid.setMessage(request.message());
        bid.setDeliveryTime(request.deliveryTime());
        bid = bidRepository.save(bid);
        UserSummaryResponse tasker = resolveRequiredSummary(taskerId);
        notificationsServiceClient.notify(task.getPosterId(), NotificationType.BID_RECEIVED,
                "New bid on your task",
                tasker.fullName() + " bid GH₵" + request.amount() + " on \"" + task.getTitle() + "\"",
                task.getId());
        return BidResponse.from(bid, tasker);
    }

    public List<BidResponse> getBidsForTask(UUID taskId, UUID currentUserId) {
        Task task = taskService.findTaskOrThrow(taskId);
        taskService.requirePoster(task, currentUserId);
        List<Bid> bids = bidRepository.findByTaskOrderByCreatedAtDesc(task);
        Map<UUID, UserSummaryResponse> summaries = resolveSummaries(bids);
        return bids.stream()
                .map(bid -> BidResponse.from(bid, summaries.get(bid.getTaskerId())))
                .toList();
    }

    @Transactional
    public TaskResponse acceptBid(UUID bidId, UUID currentUserId) {
        Bid bid = findBidOrThrow(bidId);
        Task task = bid.getTask();
        taskService.requirePoster(task, currentUserId);
        if (task.getStatus() != TaskStatus.OPEN) {
            throw new InvalidTaskStateException("This task is no longer open");
        }
        if (bid.getStatus() != BidStatus.PENDING) {
            throw new InvalidTaskStateException("This bid is no longer pending");
        }

        TransferResult adjust = paymentsServiceClient.adjustHold(task.getId(), bid.getAmount());
        if (!adjust.success()) {
            throw new InvalidRequestException("Insufficient wallet balance to accept this offer. Top up your wallet and try again.");
        }

        int updated = taskRepository.assignToBidder(task.getId(), bid.getTaskerId(), bid.getAmount());
        if (updated == 0) {
            throw new TaskAlreadyAssignedException();
        }

        bid.setStatus(BidStatus.ACCEPTED);
        bidRepository.save(bid);
        notificationsServiceClient.notify(bid.getTaskerId(), NotificationType.BID_ACCEPTED,
                "Your bid was accepted!",
                "Your bid on \"" + task.getTitle() + "\" was accepted.",
                task.getId());

        for (Bid other : bidRepository.findByTaskOrderByCreatedAtDesc(task)) {
            if (!other.getId().equals(bid.getId()) && other.getStatus() == BidStatus.PENDING) {
                other.setStatus(BidStatus.REJECTED);
                bidRepository.save(other);
                notificationsServiceClient.notify(other.getTaskerId(), NotificationType.BID_REJECTED,
                        "Your bid wasn't selected",
                        "Your bid on \"" + task.getTitle() + "\" wasn't selected.",
                        task.getId());
            }
        }

        Task refreshed = taskService.findTaskOrThrow(task.getId());
        UserSummaryResponse poster = resolveRequiredSummary(refreshed.getPosterId());
        UserSummaryResponse assignedTasker = refreshed.getAssignedTaskerId() != null
                ? resolveRequiredSummary(refreshed.getAssignedTaskerId()) : null;
        return TaskResponse.from(refreshed, bidRepository.countByTask(refreshed), null, poster, assignedTasker);
    }

    @Transactional
    public BidResponse withdrawBid(UUID bidId, UUID currentUserId) {
        Bid bid = findBidOrThrow(bidId);
        if (!bid.getTaskerId().equals(currentUserId)) {
            throw new ForbiddenActionException("You can only withdraw your own bid");
        }
        if (bid.getStatus() != BidStatus.PENDING) {
            throw new InvalidTaskStateException("Only pending bids can be withdrawn");
        }
        bid.setStatus(BidStatus.WITHDRAWN);
        bid = bidRepository.save(bid);
        UserSummaryResponse tasker = resolveRequiredSummary(bid.getTaskerId());
        notificationsServiceClient.notify(bid.getTask().getPosterId(), NotificationType.BID_WITHDRAWN,
                "A bidder withdrew",
                tasker.fullName() + " withdrew their bid on \"" + bid.getTask().getTitle() + "\"",
                bid.getTask().getId());
        return BidResponse.from(bid, tasker);
    }

    private Bid findBidOrThrow(UUID id) {
        return bidRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Bid not found"));
    }

    private UserSummaryResponse resolveRequiredSummary(UUID userId) {
        return userServiceClient.getSummary(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private Map<UUID, UserSummaryResponse> resolveSummaries(List<Bid> bids) {
        Set<UUID> ids = new HashSet<>();
        for (Bid bid : bids) {
            ids.add(bid.getTaskerId());
        }
        return userServiceClient.getSummaries(ids).stream()
                .collect(Collectors.toMap(UserSummaryResponse::id, s -> s));
    }
}
