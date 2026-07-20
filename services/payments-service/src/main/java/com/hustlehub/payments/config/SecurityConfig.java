package com.hustlehub.payments.config;

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
 * Spring Security is on the classpath, which means Boot's default-secure autoconfiguration would
 * otherwise block every request behind a generated HTTP Basic password unless a SecurityFilterChain
 * bean is defined explicitly (bit the gateway service in this same reactor already). No CORS
 * config here on purpose - the gateway owns CORS centrally and is the only way this service is
 * ever reached. No AuthenticationManager/password beans either - this service never checks a
 * password, only validates JWTs already issued by identity-service.
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
                .requestMatchers("/health").permitAll()
                // Paystack calls this directly with no JWT - the HMAC signature check inside
                // PaystackWebhookController stands in for authentication on this one path.
                .requestMatchers(HttpMethod.POST, "/api/payments/webhooks/paystack").permitAll()
                // Internal service-to-service calls carry X-Internal-Key instead of a user JWT;
                // the key check happens inside InternalPaymentsController itself, not here.
                .requestMatchers(HttpMethod.POST, "/internal/payments/**").permitAll()
                .anyRequest().authenticated())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
