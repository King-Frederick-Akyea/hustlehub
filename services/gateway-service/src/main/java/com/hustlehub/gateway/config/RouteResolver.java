package com.hustlehub.gateway.config;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class RouteResolver {

    private final GatewayProperties gatewayProperties;

    public Optional<String> resolveTarget(String path) {
        return gatewayProperties.getRoutes().stream()
                .filter(route -> path.equals(route.getPrefix()) || path.startsWith(route.getPrefix() + "/"))
                // longest prefix wins, in case routes are ever nested (e.g. /api/tasks and /api/tasks/bookmarks)
                .max(Comparator.comparingInt(route -> route.getPrefix().length()))
                .map(GatewayProperties.Route::getTarget);
    }
}
