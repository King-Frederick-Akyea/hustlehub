package com.hustlehub.common.dto;

import java.math.BigDecimal;

/** Completed-task stats for a user, as tasker. Resolved from tasks-service via {@code TasksServiceClient}. */
public record UserStatsResponse(long completedTasksCount, BigDecimal totalEarnings) {
}
