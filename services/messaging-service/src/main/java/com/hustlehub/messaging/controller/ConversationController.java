package com.hustlehub.messaging.controller;

import com.hustlehub.common.security.AuthPrincipal;
import com.hustlehub.messaging.dto.request.SendMessageRequest;
import com.hustlehub.messaging.dto.request.StartConversationRequest;
import com.hustlehub.messaging.dto.response.ChatMessageResponse;
import com.hustlehub.messaging.dto.response.ConversationResponse;
import com.hustlehub.messaging.service.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @PostMapping("/with/{userId}")
    public ConversationResponse startConversationWith(@AuthenticationPrincipal AuthPrincipal principal,
                                                        @PathVariable UUID userId,
                                                        @RequestBody(required = false) StartConversationRequest request) {
        return conversationService.startConversationWith(principal.id(), userId, request);
    }

    @GetMapping
    public List<ConversationResponse> getConversations(@AuthenticationPrincipal AuthPrincipal principal) {
        return conversationService.getConversations(principal.id());
    }

    @GetMapping("/{id}")
    public ConversationResponse getConversation(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        return conversationService.getConversation(principal.id(), id);
    }

    @GetMapping("/{id}/messages")
    public List<ChatMessageResponse> getMessages(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        return conversationService.getMessages(principal.id(), id);
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageResponse sendMessage(@AuthenticationPrincipal AuthPrincipal principal,
                                            @PathVariable UUID id,
                                            @Valid @RequestBody SendMessageRequest request) {
        return conversationService.sendMessage(principal.id(), id, request.text());
    }

    @PostMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAsRead(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        conversationService.markAsRead(principal.id(), id);
    }
}
