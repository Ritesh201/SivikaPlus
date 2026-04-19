package com.sivikaplus.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService; // ← Spring will inject UserDetailsServiceImpl
    private final StringRedisTemplate redisTemplate;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }
        try {
            String jwt = header.substring(7);
            String email = jwtUtil.extractUsername(jwt);
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // ── check logout blacklist ──────────────────
                if (Boolean.TRUE.equals(redisTemplate.hasKey("logout:" + email))) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token invalidated");
                    return;
                }

                // ── check token blacklist (for refresh tokens) ──
                if (Boolean.TRUE.equals(redisTemplate.hasKey("blacklist:" + jwt))) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token blacklisted");
                    return;
                }
                // ───────────────────────────────────────────────
                UserDetails user = userDetailsService.loadUserByUsername(email);
                if (jwtUtil.isTokenValid(jwt, user)) {
                    var auth = new UsernamePasswordAuthenticationToken(
                            user, null, user.getAuthorities()
                    );
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        } catch (Exception e) {
            log.warn("JWT filter error: {}", e.getMessage());
        }
        chain.doFilter(request, response);
    }
}