package com.hustlehub.tasks.service;

import com.hustlehub.common.client.NotificationsServiceClient;
import com.hustlehub.common.client.PaymentsServiceClient;
import com.hustlehub.common.client.UserServiceClient;
import com.hustlehub.common.dto.CompletedEngagementResponse;
import com.hustlehub.common.dto.EngagementParticipantsResponse;
import com.hustlehub.common.dto.NotificationType;
import com.hustlehub.common.dto.TransferResult;
import com.hustlehub.common.dto.UserStatsResponse;
import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.common.exception.ForbiddenActionException;
import com.hustlehub.common.exception.InvalidRequestException;
import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.tasks.dto.request.CreateTaskRequest;
import com.hustlehub.tasks.dto.response.TaskResponse;
import com.hustlehub.tasks.entity.Bid;
import com.hustlehub.tasks.entity.BidStatus;
import com.hustlehub.tasks.entity.Task;
import com.hustlehub.tasks.entity.TaskCategory;
import com.hustlehub.tasks.entity.TaskStatus;
import com.hustlehub.tasks.exception.InvalidTaskStateException;
import com.hustlehub.tasks.exception.TaskAlreadyAssignedException;
import com.hustlehub.tasks.repository.BidRepository;
import com.hustlehub.tasks.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final BidRepository bidRepository;
    private final UserServiceClient userServiceClient;
    private final PaymentsServiceClient paymentsServiceClient;
    private final NotificationsServiceClient notificationsServiceClient;

    @Transactional
    public TaskResponse createTask(UUID posterId, CreateTaskRequest request) {
        if (request.deadline().isBefore(Instant.now())) {
            throw new InvalidTaskStateException("Deadline must be in the future");
        }
        if (request.isDelivery()) {
            boolean missingPickup = request.pickupLocation() == null || request.pickupLocation().isBlank();
            boolean missingDropoff = request.dropoffLocation() == null || request.dropoffLocation().isBlank();
            if (missingPickup || missingDropoff) {
                throw new InvalidTaskStateException("Pickup and dropoff locations are required for delivery tasks");
            }
        }

        UUID taskId = UUID.randomUUID();
        TransferResult hold = paymentsServiceClient.hold(posterId, request.budget(), "TASK", taskId,
                "Task escrow: " + request.title().trim());
        if (!hold.success()) {
            throw new InvalidRequestException("Insufficient wallet balance to post this task. Top up your wallet and try again.");
        }

        Task task = Task.builder()
                .id(taskId)
                .posterId(posterId)
                .title(request.title().trim())
                .description(request.description().trim())
                .category(TaskCategory.fromJson(request.category()))
                .budget(request.budget())
                .location(request.location().trim())
                .locationLat(request.locationLat())
                .locationLng(request.locationLng())
                .delivery(request.isDelivery())
                .pickupLocation(request.pickupLocation())
                .pickupLat(request.pickupLat())
                .pickupLng(request.pickupLng())
                .dropoffLocation(request.dropoffLocation())
                .dropoffLat(request.dropoffLat())
                .dropoffLng(request.dropoffLng())
                .deadline(request.deadline())
                .urgent(request.isUrgent())
                .build();
        task = taskRepository.save(task);
        UserSummaryResponse poster = resolveRequiredSummary(posterId);
        return TaskResponse.from(task, 0, null, poster, null);
    }

    public List<TaskResponse> getOpenTasks(UUID currentUserId, String category, String search) {
        TaskCategory categoryFilter = (category == null || category.isBlank()) ? null : TaskCategory.fromJson(category);
        String searchFilter = (search == null || search.isBlank()) ? null : search.trim().toLowerCase();

        List<Task> tasks = taskRepository.findByStatusAndPosterIdNotOrderByCreatedAtDesc(TaskStatus.OPEN, currentUserId).stream()
                .filter(task -> categoryFilter == null || task.getCategory() == categoryFilter)
                .filter(task -> searchFilter == null || task.getTitle().toLowerCase().contains(searchFilter))
                .toList();

        Map<UUID, UserSummaryResponse> summaries = resolveSummaries(tasks);
        return tasks.stream()
                .map(task -> TaskResponse.from(task, bidRepository.countByTask(task), myBidStatus(task, currentUserId),
                        summaries.get(task.getPosterId()), resolveAssignedTasker(task, summaries)))
                .toList();
    }

    public List<TaskResponse> getMyTasks(UUID currentUserId, String role) {
        List<Task> tasks = "assigned".equalsIgnoreCase(role)
                ? taskRepository.findByAssignedTaskerIdOrderByCreatedAtDesc(currentUserId)
                : taskRepository.findByPosterIdOrderByCreatedAtDesc(currentUserId);
        Map<UUID, UserSummaryResponse> summaries = resolveSummaries(tasks);
        return tasks.stream()
                .map(task -> TaskResponse.from(task, bidRepository.countByTask(task), myBidStatus(task, currentUserId),
                        summaries.get(task.getPosterId()), resolveAssignedTasker(task, summaries)))
                .toList();
    }

    public TaskResponse getTask(UUID id, UUID currentUserId) {
        Task task = findTaskOrThrow(id);
        UserSummaryResponse poster = resolveRequiredSummary(task.getPosterId());
        UserSummaryResponse assignedTasker = task.getAssignedTaskerId() != null
                ? resolveRequiredSummary(task.getAssignedTaskerId()) : null;
        return TaskResponse.from(task, bidRepository.countByTask(task), myBidStatus(task, currentUserId), poster, assignedTasker);
    }

    @Transactional
    public TaskResponse acceptTask(UUID id, UUID currentUserId) {
        Task task = findTaskOrThrow(id);
        if (task.getPosterId().equals(currentUserId)) {
            throw new ForbiddenActionException("You cannot accept your own task");
        }
        int updated = taskRepository.claimTaskAtListedPrice(id, currentUserId);
        if (updated == 0) {
            throw new TaskAlreadyAssignedException();
        }
        Task refreshed = findTaskOrThrow(id);
        UserSummaryResponse poster = resolveRequiredSummary(refreshed.getPosterId());
        UserSummaryResponse assignedTasker = resolveRequiredSummary(refreshed.getAssignedTaskerId());
        notificationsServiceClient.notify(refreshed.getPosterId(), NotificationType.TASK_ACCEPTED,
                "Your task was accepted",
                assignedTasker.fullName() + " accepted \"" + refreshed.getTitle() + "\"",
                refreshed.getId());
        return TaskResponse.from(refreshed, bidRepository.countByTask(refreshed), myBidStatus(refreshed, currentUserId), poster, assignedTasker);
    }

    @Transactional
    public TaskResponse cancelTask(UUID id, UUID currentUserId) {
        Task task = findTaskOrThrow(id);
        requirePoster(task, currentUserId);
        if (task.getStatus() != TaskStatus.OPEN) {
            throw new InvalidTaskStateException("Only open tasks can be cancelled");
        }
        task.setStatus(TaskStatus.CANCELLED);
        task = taskRepository.save(task);
        paymentsServiceClient.refundHold(task.getId());
        UserSummaryResponse poster = resolveRequiredSummary(task.getPosterId());
        return TaskResponse.from(task, bidRepository.countByTask(task), null, poster, null);
    }

    @Transactional
    public TaskResponse completeTask(UUID id, UUID currentUserId) {
        Task task = findTaskOrThrow(id);
        boolean isAssignedTasker = task.getAssignedTaskerId() != null && task.getAssignedTaskerId().equals(currentUserId);
        if (!isAssignedTasker) {
            throw new ForbiddenActionException("Only the assigned tasker can mark this task complete");
        }
        if (task.getStatus() != TaskStatus.IN_PROGRESS) {
            throw new InvalidTaskStateException("Only in-progress tasks can be marked complete");
        }
        task.setStatus(TaskStatus.COMPLETED);
        task.setCompletedAt(Instant.now());
        task = taskRepository.save(task);
        paymentsServiceClient.releaseHold(task.getId(), task.getAssignedTaskerId());

        notificationsServiceClient.notify(task.getPosterId(), NotificationType.TASK_COMPLETED,
                "Task marked complete",
                "\"" + task.getTitle() + "\" was marked complete.",
                task.getId());
        BigDecimal amountPaid = task.getFinalPrice() != null ? task.getFinalPrice() : task.getBudget();
        notificationsServiceClient.notify(task.getAssignedTaskerId(), NotificationType.TASK_PAYMENT_RECEIVED,
                "You got paid!",
                "You received GH₵" + amountPaid + " for \"" + task.getTitle() + "\"",
                task.getId());

        UserSummaryResponse poster = resolveRequiredSummary(task.getPosterId());
        UserSummaryResponse assignedTasker = task.getAssignedTaskerId() != null
                ? resolveRequiredSummary(task.getAssignedTaskerId()) : null;
        return TaskResponse.from(task, bidRepository.countByTask(task), myBidStatus(task, currentUserId), poster, assignedTasker);
    }

    Task findTaskOrThrow(UUID id) {
        return taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    void requirePoster(Task task, UUID userId) {
        if (!task.getPosterId().equals(userId)) {
            throw new ForbiddenActionException("Only the task's poster can do this");
        }
    }

    private String myBidStatus(Task task, UUID currentUserId) {
        Optional<Bid> myLatestBid = bidRepository.findByTaskAndTaskerId(task, currentUserId).stream()
                .filter(b -> b.getStatus() != BidStatus.WITHDRAWN)
                .findFirst();
        return myLatestBid.map(b -> b.getStatus().toJson()).orElse(null);
    }

    private UserSummaryResponse resolveRequiredSummary(UUID userId) {
        return userServiceClient.getSummary(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    /** Batches every poster/assignedTasker id across the whole list into a single identity-service call. */
    private Map<UUID, UserSummaryResponse> resolveSummaries(List<Task> tasks) {
        Set<UUID> ids = new HashSet<>();
        for (Task task : tasks) {
            ids.add(task.getPosterId());
            if (task.getAssignedTaskerId() != null) {
                ids.add(task.getAssignedTaskerId());
            }
        }
        return userServiceClient.getSummaries(ids).stream()
                .collect(Collectors.toMap(UserSummaryResponse::id, s -> s));
    }

    private UserSummaryResponse resolveAssignedTasker(Task task, Map<UUID, UserSummaryResponse> summaries) {
        return task.getAssignedTaskerId() == null ? null : summaries.get(task.getAssignedTaskerId());
    }

    /** For identity-service's public/own profile response — completed jobs as tasker + what they earned. */
    public UserStatsResponse getStats(UUID taskerId) {
        long completedCount = taskRepository.countByAssignedTaskerIdAndStatus(taskerId, TaskStatus.COMPLETED);
        BigDecimal totalEarnings = taskRepository.sumFinalPriceByAssignedTaskerAndStatus(taskerId, TaskStatus.COMPLETED);
        return new UserStatsResponse(completedCount, totalEarnings);
    }

    /** For reviews-service's "eligible to review" list — every completed task this user was either side of. */
    public List<CompletedEngagementResponse> getCompletedEngagements(UUID userId) {
        List<CompletedEngagementResponse> engagements = new ArrayList<>();
        for (Task task : taskRepository.findByPosterIdAndStatus(userId, TaskStatus.COMPLETED)) {
            engagements.add(new CompletedEngagementResponse("TASK", task.getId(), task.getAssignedTaskerId(), task.getCompletedAt()));
        }
        for (Task task : taskRepository.findByAssignedTaskerIdAndStatus(userId, TaskStatus.COMPLETED)) {
            engagements.add(new CompletedEngagementResponse("TASK", task.getId(), task.getPosterId(), task.getCompletedAt()));
        }
        return engagements;
    }

    /**
     * Admin-suspend cleanup: cancels (with escrow refund) every OPEN task this user posted, same
     * lifecycle transition as a self-service cancelTask, just triggered by an admin action instead
     * of the poster. Tasks already IN_PROGRESS/COMPLETED are untouched — those involve another
     * user who shouldn't be penalized by this poster's suspension.
     */
    @Transactional
    public void suspendCleanup(UUID posterId) {
        for (Task task : taskRepository.findByPosterIdAndStatus(posterId, TaskStatus.OPEN)) {
            task.setStatus(TaskStatus.CANCELLED);
            taskRepository.save(task);
            paymentsServiceClient.refundHold(task.getId());
        }
    }

    /** For reviews-service's server-side review-eligibility re-validation. Empty if the task was never assigned (no real engagement to review). */
    public Optional<EngagementParticipantsResponse> getParticipants(UUID taskId) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null || task.getAssignedTaskerId() == null) {
            return Optional.empty();
        }
        return Optional.of(new EngagementParticipantsResponse(task.getPosterId(), task.getAssignedTaskerId(), task.getStatus() == TaskStatus.COMPLETED));
    }
}
