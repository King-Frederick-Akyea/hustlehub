package com.hustlehub.gateway.controller;

import com.hustlehub.common.exception.ResourceNotFoundException;
import com.hustlehub.common.exception.UpstreamServiceException;
import com.hustlehub.gateway.config.RouteResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.Collections;
import java.util.Set;

/**
 * Forwards every request to whichever downstream service owns its path prefix (see
 * {@link com.hustlehub.gateway.config.GatewayProperties}). Deliberately dumb: no auth, no
 * business logic — just method/headers/query/body in, status/headers/body out, unchanged. Each
 * downstream service is responsible for authenticating its own requests.
 */
@RestController
@RequiredArgsConstructor
public class ProxyController {

    // Hop-by-hop headers that must not be blindly forwarded (RFC 7230 6.1) — Host/Content-Length
    // get recomputed for the outgoing request, and Transfer-Encoding/Connection are connection-
    // scoped, not something we should copy from the upstream response onto our own.
    private static final Set<String> SKIP_REQUEST_HEADERS = Set.of("host", "content-length", "connection");
    private static final Set<String> SKIP_RESPONSE_HEADERS = Set.of("transfer-encoding", "connection", "content-length");

    private final RouteResolver routeResolver;
    private final RestClient restClient;

    @RequestMapping("/**")
    public ResponseEntity<byte[]> proxy(HttpServletRequest request, @RequestBody(required = false) byte[] body) {
        String path = request.getRequestURI();
        String targetBase = routeResolver.resolveTarget(path)
                .orElseThrow(() -> new ResourceNotFoundException("No service is registered for " + path));

        String query = request.getQueryString();
        String targetUrl = targetBase + path + (query != null ? "?" + query : "");

        RestClient.RequestBodySpec requestSpec = restClient.method(HttpMethod.valueOf(request.getMethod()))
                .uri(targetUrl);

        Collections.list(request.getHeaderNames()).forEach(name -> {
            if (!SKIP_REQUEST_HEADERS.contains(name.toLowerCase())) {
                Collections.list(request.getHeaders(name)).forEach(value -> requestSpec.header(name, value));
            }
        });

        try {
            ResponseEntity<byte[]> upstream = (body != null && body.length > 0)
                    ? requestSpec.body(body).retrieve().toEntity(byte[].class)
                    : requestSpec.retrieve().toEntity(byte[].class);
            return relay(upstream.getStatusCode(), upstream.getHeaders(), upstream.getBody());
        } catch (RestClientResponseException e) {
            // A real API error from downstream (400/401/403/404/...) - relay it verbatim rather
            // than masking it as a generic gateway failure.
            return relay(e.getStatusCode(), e.getResponseHeaders(), e.getResponseBodyAsByteArray());
        } catch (RestClientException e) {
            throw new UpstreamServiceException("Could not reach the service behind " + path + ": " + e.getMessage());
        }
    }

    private ResponseEntity<byte[]> relay(HttpStatusCode status, HttpHeaders upstreamHeaders, byte[] body) {
        HttpHeaders headers = new HttpHeaders();
        if (upstreamHeaders != null) {
            upstreamHeaders.forEach((name, values) -> {
                if (!SKIP_RESPONSE_HEADERS.contains(name.toLowerCase())) {
                    headers.put(name, values);
                }
            });
        }
        return ResponseEntity.status(status).headers(headers).body(body);
    }
}
