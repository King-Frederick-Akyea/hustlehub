package com.hustlehub.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Stateless JWT auth shared by every service — no DB lookup, the token's claims are trusted
 * as-is (see {@link JwtValidator}). Identical across services on purpose: they all need to
 * agree on how a request gets authenticated, even though each has its own authorization rules.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtValidator jwtValidator;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ") && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = header.substring(7);
            Optional<AuthPrincipal> principal = jwtValidator.validateAndGetPrincipal(token);
            if (principal.isPresent()) {
                AuthPrincipal auth = principal.get();
                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + auth.role().name()));
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(auth, null, authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        filterChain.doFilter(request, response);
    }
}
