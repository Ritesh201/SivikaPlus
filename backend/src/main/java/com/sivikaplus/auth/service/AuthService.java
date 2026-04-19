package com.sivikaplus.auth.service;

import com.sivikaplus.auth.dto.AuthDto;
import com.sivikaplus.auth.model.SellerProfile;
import com.sivikaplus.auth.model.User;
import com.sivikaplus.auth.repository.SellerProfileRepository;
import com.sivikaplus.auth.repository.UserRepository;
import com.sivikaplus.auth.security.JwtUtil;
import com.sivikaplus.exception.BadRequestException;
import com.sivikaplus.exception.UnauthorizedException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final StringRedisTemplate redisTemplate;
    private final SellerProfileRepository sellerProfileRepository;

    @Transactional
    public AuthDto.MessageResponse register(AuthDto.RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail()))
            throw new BadRequestException("Email already registered");
        if (userRepository.existsByPhone(req.getPhone()))
            throw new BadRequestException("Phone already registered");

        User user = User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .role(req.getRole() != null ? req.getRole() : User.Role.CUSTOMER)
                .verified(false)
                .active(true)
                .build();
        user = userRepository.save(user);

//        if (user.getRole() == User.Role.SELLER) {
//            if (req.getBusinessName() == null || req.getBusinessName().isBlank())
//                throw new BadRequestException("Business name required for sellers");
//            sellerProfileRepository.save(SellerProfile.builder()
//                    .user(user)
//                    .businessName(req.getBusinessName())
//                    .businessDescription(req.getBusinessDescription())
//                    .gstin(req.getGstin())
//                    .build());
//        }

        String reqId = otpService.generateAndSend(req.getPhone(), "REGISTRATION");
        return new AuthDto.MessageResponse("OTP sent|" + reqId); // pass reqId to frontend
    }

    @Transactional
    public AuthDto.MessageResponse verifyMobile(AuthDto.VerifyOtpRequest req) {
        if (!otpService.verifyOtp(req.getMobile(), req.getCode(), "REGISTRATION"))
            throw new BadRequestException("Invalid or expired OTP");

        User user = userRepository.findByPhone(req.getMobile())
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setVerified(true);
        userRepository.save(user);

        return new AuthDto.MessageResponse("Mobile verified successfully");
    }


    // ── LOGIN ──────────────────────────────────────────────
    public AuthDto.AuthResponse login(AuthDto.LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadRequestException("No account found. Please register first."));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash()))
            throw new BadRequestException("Incorrect password. Please try again.");

        if (!user.isVerified()) {
            String reqId = otpService.generateAndSend(user.getPhone(), "REGISTRATION");

            log.info("User is not verified: {}", reqId);
            throw new UnauthorizedException("OTP sent|" + reqId + "|" + user.getPhone());
        }
        redisTemplate.delete("logout:" + req.getEmail());
        return buildAuthResponse(user);
    }

    // ── REFRESH ────────────────────────────────────────────
    public AuthDto.AuthResponse refresh(String refreshToken) {
        // Check if token is blacklisted
        if (Boolean.TRUE.equals(redisTemplate.hasKey("blacklist:" + refreshToken)))
            throw new RuntimeException("Refresh token is invalid or expired");

        String email;
        try {
            email = jwtUtil.extractUsername(refreshToken);
        } catch (Exception e) {
            throw new RuntimeException("Invalid refresh token");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Blacklist old refresh token
        redisTemplate.opsForValue().set(
                "blacklist:" + refreshToken, "true", 7, TimeUnit.DAYS
        );

        return buildAuthResponse(user);
    }

    // ── LOGOUT ─────────────────────────────────────────────
    public void logout(String email) {
        // Blacklist all tokens for this user by storing email-based key
        // Frontend should discard tokens on their side too
        redisTemplate.opsForValue().set(
                "logout:" + email, "true", 1, TimeUnit.DAYS
        );
        log.info("User logged out: {}", email);
    }

    @Transactional
    public AuthDto.MessageResponse forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("No account found with this email."));

        String reqId = otpService.generateAndSend(user.getPhone(), "FORGOT_PASSWORD");
        // Return masked mobile so frontend can show "OTP sent to ******1489"
        String maskedPhone = user.getPhone().replaceAll("\\d(?=\\d{4})", "*");
        return new AuthDto.MessageResponse("OTP sent|" + reqId + "|" + maskedPhone + "|" + user.getPhone());
    }

    @Transactional
    public AuthDto.MessageResponse resetPassword(AuthDto.ResetPasswordRequest req) {
        if (!otpService.verifyOtp(req.getMobile(), req.getCode(), "FORGOT_PASSWORD"))
            throw new BadRequestException("Invalid or expired OTP");

        User user = userRepository.findByPhone(req.getMobile())
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);

        return new AuthDto.MessageResponse("Password reset successful");
    }

    // ── HELPER ─────────────────────────────────────────────
    private AuthDto.AuthResponse buildAuthResponse(User user) {

        String accessToken = jwtUtil.generateToken(
                 user,
                user.getRole().name(),
                user.getId().toString()
        );
        String refreshToken = jwtUtil.generateRefreshToken(user);

        AuthDto.UserDto userDto = new AuthDto.UserDto();
        userDto.setId(user.getId().toString());
        userDto.setEmail(user.getEmail());
        userDto.setFullName(user.getFullName());
        userDto.setRole(user.getRole().name());
        userDto.setVerified(user.isVerified());
        userDto.setProfileImageUrl(user.getProfileImageUrl());
        // ✅ Attach seller profile if exists
        if (user.getRole() == User.Role.SELLER) {
            sellerProfileRepository.findByUserId(user.getId())
                    .ifPresent(profile -> {
                        AuthDto.SellerDto sellerDto = new AuthDto.SellerDto();
                        sellerDto.setBusinessName(profile.getBusinessName());
                        sellerDto.setVerificationStatus(profile.getVerificationStatus().name());
                        sellerDto.setRating(profile.getRating());
                        userDto.setSellerProfile(sellerDto);
                    });
        }
        AuthDto.AuthResponse response = new AuthDto.AuthResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setExpiresIn(86400000L);
        response.setUser(userDto);

        return response;
    }
}