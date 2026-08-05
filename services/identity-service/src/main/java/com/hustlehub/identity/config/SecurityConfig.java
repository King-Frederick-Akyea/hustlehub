package com.hustlehub.identity.config;

import com.hustlehub.common.security.JwtAuthenticationFilter;
import com.hustlehub.common.security.RestAccessDeniedHandler;
import com.hustlehub.common.security.RestAuthEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Mirrors the monolith's SecurityConfig, with two changes: (1) the JWT filter/entry-point/
 * access-denied-handler now come from {@code common} instead of a locally-recreated copy, and
 * (2) CORS is no longer configured here at all — the gateway is the only thing that talks to a
 * browser now, and it owns CORS centrally, so this service (reached only via the gateway or
 * other backend services) doesn't need a CORS filter of its own.
 */
@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthEntryPoint restAuthEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider::authenticate;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(restAuthEntryPoint)
                .accessDeniedHandler(restAccessDeniedHandler))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST,
                    "/api/auth/register", "/api/auth/login", "/api/auth/refresh",
                    "/api/auth/logout", "/api/auth/forgot-password", "/api/auth/reset-password",
                    "/api/auth/admin/login"
                ).permitAll()
                // Avatar images are rendered by React Native's <Image>, which hits this URL
                // directly (no Authorization header attached) — must be publicly readable, same
                // as any other public profile picture. Never anything sensitive at this path.
                .requestMatchers(HttpMethod.GET, "/api/users/*/avatar").permitAll()
                // Internal service-to-service calls carry X-Internal-Key instead of a user JWT;
                // the key check happens inside InternalUserController itself, not here.
                .requestMatchers(HttpMethod.GET, "/internal/users/**").permitAll()
                .anyRequest().authenticated())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
