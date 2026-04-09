package com.sivikaplus.auth.service;

import com.sivikaplus.auth.dto.AuthDto.*;
import com.sivikaplus.auth.model.RefreshToken;
import com.sivikaplus.auth.model.SellerProfile;
import com.sivikaplus.auth.model.User;
import com.sivikaplus.auth.repository.RefreshTokenRepository;
import com.sivikaplus.auth.repository.SellerProfileRepository;
import com.sivikaplus.auth.repository.UserRepository;
import com.sivikaplus.auth.security.JwtUtil;
import com.sivikaplus.exception.BadRequestException;
import com.sivikaplus.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authManager;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    // Switch from @RequiredArgsConstructor to explicit constructor so we can
    // put @Lazy on AuthenticationManager only — avoids the startup cycle where
    // AuthService → AuthenticationManager → AuthenticationProvider → SecurityConfig
    // → (still initializing) → deadlock.


    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail()))
            throw new BadRequestException("Email already registered");

        User user = User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .role(req.getRole())
                .build();
        user = userRepository.save(user);

        if (user.getRole() == User.Role.SELLER) {
            if (req.getBusinessName() == null || req.getBusinessName().isBlank())
                throw new BadRequestException("Business name required for sellers");
            sellerProfileRepository.save(SellerProfile.builder()
                    .user(user)
                    .businessName(req.getBusinessName())
                    .businessDescription(req.getBusinessDescription())
                    .gstin(req.getGstin())
                    .build());
        }

        return buildResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new UnauthorizedException("Invalid email or password");
        }
        User user = userRepository.findActiveByEmail(req.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Account not found"));
        return buildResponse(user);
    }

    @Transactional
    public AuthResponse refresh(String tokenStr) {
        RefreshToken token = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        if (token.isRevoked() || token.getExpiresAt().isBefore(ZonedDateTime.now()))
            throw new UnauthorizedException("Refresh token expired");
        token.setRevoked(true);
        refreshTokenRepository.save(token);
        return buildResponse(token.getUser());
    }

    @Transactional
    public void logout(String email) {
        userRepository.findByEmail(email)
                .ifPresent(u -> refreshTokenRepository.revokeAllByUserId(u.getId()));
    }

    private AuthResponse buildResponse(User user) {
        var userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );

        String access = jwtUtil.generateToken(userDetails, user.getRole().name(), user.getId().toString());
        String refreshStr = UUID.randomUUID().toString();

        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(refreshStr)
                .expiresAt(ZonedDateTime.now().plusSeconds(refreshExpiration / 1000))
                .build());

        AuthResponse res = new AuthResponse();
        res.setAccessToken(access);
        res.setRefreshToken(refreshStr);
        res.setExpiresIn(jwtExpiration / 1000);
        res.setUser(toUserDto(user));
        return res;
    }

    public UserDto toUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId().toString());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRole(user.getRole().name());
        dto.setVerified(user.isVerified());
        dto.setProfileImageUrl(user.getProfileImageUrl());

        if (user.getRole() == User.Role.SELLER) {
            sellerProfileRepository.findByUserId(user.getId()).ifPresent(sp -> {
                SellerDto sd = new SellerDto();
                sd.setId(sp.getId().toString());
                sd.setBusinessName(sp.getBusinessName());
                sd.setVerificationStatus(sp.getVerificationStatus().name());
                sd.setRating(sp.getRating().doubleValue());
                dto.setSellerProfile(sd);
            });
        }
        return dto;
    }
}
