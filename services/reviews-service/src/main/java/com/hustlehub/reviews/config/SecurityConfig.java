package com.hustlehub.reviews.config;

import com.hustlehub.common.security.JwtAuthenticationFilter;
import com.hustlehub.common.security.RestAccessDeniedHandler;
import com.hustlehub.common.security.RestAuthEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Same shape as rentals-service's SecurityConfig: every /api/reviews/** and /api/reports/**
 * endpoint requires a valid JWT (student or admin - role-specific checks for the /admin/**
 * sub-paths happen inline in the controller, same style as InternalUserController's
 * requireInternalKey). /internal/** endpoints are separately permitted without a JWT, guarded
 * instead by X-Internal-Key (checked in the controller), same as identity-service's
 * InternalUserController.
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
                .requestMatchers(HttpMethod.GET, "/internal/reviews/**").permitAll()
                .anyRequest().authenticated())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
