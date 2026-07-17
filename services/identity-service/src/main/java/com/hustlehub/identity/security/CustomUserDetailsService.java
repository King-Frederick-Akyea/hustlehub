package com.hustlehub.identity.security;

import com.hustlehub.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Used only for the login handshake — {@code AuthenticationManager}/{@code DaoAuthenticationProvider}
 * need a {@link UserDetailsService} to verify the submitted password against. Every other
 * authenticated request is resolved straight from the JWT via {@code common}'s
 * {@code JwtAuthenticationFilter}/{@code AuthPrincipal}, never through this class.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmailIgnoreCase(email)
                .map(SecurityUser::new)
                .orElseThrow(() -> new UsernameNotFoundException("No user with email " + email));
    }

    public UserDetails loadUserById(UUID id) {
        return userRepository.findById(id)
                .map(SecurityUser::new)
                .orElse(null);
    }
}
