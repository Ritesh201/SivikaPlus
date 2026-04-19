package com.sivikaplus.auth.service;

import com.sivikaplus.auth.model.Otp;
import com.sivikaplus.auth.repository.OtpRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class OtpService {

    private final OtpRepository otpRepository;
    private final Msg91Service msg91Service;

    // Send OTP — returns reqId from MSG91
    public String generateAndSend(String mobile, String type) {
        // delete old OTPs
        otpRepository.deleteByMobileAndType(mobile, type);

        // send via MSG91 widget
        String reqId = msg91Service.sendOtp(mobile);

        // store reqId in DB so we can verify later
        Otp otp = Otp.builder()
                .mobile(mobile)
                .code(reqId)      // store reqId as code
                .type(type)
                .used(false)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();

        otpRepository.save(otp);
        log.info("OTP sent to {} with reqId: {}", mobile, reqId);

        return reqId;
    }

    // Verify OTP using reqId + otp from user
    public boolean verifyOtp(String mobile, String otpCode, String type) {
        return otpRepository
                .findTopByMobileAndTypeAndUsedFalseOrderByCreatedAtDesc(mobile, type)
                .map(otp -> {
                    if (otp.getExpiresAt().isBefore(LocalDateTime.now())) return false;

                    // verify with MSG91
                    boolean valid = msg91Service.verifyOtp(otp.getCode(), otpCode);
                    if (!valid) return false;

                    otp.setUsed(true);
                    otpRepository.save(otp);
                    return true;
                })
                .orElse(false);
    }
}