package com.hustlehub.tasks.dto.response;

import com.hustlehub.common.dto.UserSummaryResponse;
import com.hustlehub.tasks.entity.TaskStatusUpdate;

import java.time.Instant;
import java.util.UUID;

public record TaskStatusUpdateResponse(
        UUID id,
        String note,
        UserSummaryResponse author,
        Instant createdAt
) {
    /** {@code author} is pre-resolved by the service layer via UserServiceClient. */
    public static TaskStatusUpdateResponse from(TaskStatusUpdate update, UserSummaryResponse author) {
        return new TaskStatusUpdateResponse(
                update.getId(),
                update.getNote(),
                author,
                update.getCreatedAt()
        );
    }
}
