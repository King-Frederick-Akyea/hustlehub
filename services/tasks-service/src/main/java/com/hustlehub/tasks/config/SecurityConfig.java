package com.hustlehub.tasks.config;

import com.hustlehub.common.security.JwtAuthenticationFilter;
import com.hustlehub.common.security.RestAccessDeniedHandler;
import com.hustlehub.common.security.RestAuthEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * No CORS config here — the gateway owns CORS centrally now; this service is only ever called
 * via the gateway or other services, never directly by a browser/app. No public routes either:
 * every /api/tasks/** and /api/bids/** endpoint requires authentication in the monolith today,
 * so this is a plain "everything requires a valid JWT" chain.
 *
 * Defining this bean is mandatory, not optional — with spring-boot-starter-security on the
 * classpath and no SecurityFilterChain bean, Boot activates a default-secure chain guarded by a
 * random generated HTTP Basic password that blocks every request (hit this exact bug building
 * the gateway in this same session).
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthEntryPoint restAuthEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(restAuthEntryPoint)
                .accessDeniedHandler(restAccessDeniedHandler))
            .authorizeHttpRequests(auth -> auth
                // Internal service-to-service calls carry X-Internal-Key instead of a user JWT;
                // the key check happens inside InternalTaskController itself, not here. Both
                // GET (stats/eligibility lookups) and POST (admin-suspend cleanup) live under here.
                .requestMatchers("/internal/tasks/**").permitAll()
                .anyRequest().authenticated())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
