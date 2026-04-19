package com.sivikaplus.auth.service;

import com.sivikaplus.auth.model.Otp;
import com.sivikaplus.auth.repository.OtpRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class OtpService {

    private final OtpRepository otpRepository;
    private final Msg91Service msg91Service;  // ← replaced Fast2SmsService

    @Value("${otp.expiry-minutes}")
    private int expiryMinutes;

    public void generateAndSend(String mobile, String type) {
        otpRepository.deleteByMobileAndType(mobile, type);

        String code = String.format("%06d", (int)(Math.random() * 1000000));

        Otp otp = Otp.builder()
                .mobile(mobile)
                .code(code)
                .type(type)
                .used(false)
                .expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes))
                .build();

        otpRepository.save(otp);
        msg91Service.sendOtp(mobile, code);  // ← updated
    }

    public boolean verifyOtp(String mobile, String code, String type) {
        return otpRepository
                .findTopByMobileAndTypeAndUsedFalseOrderByCreatedAtDesc(mobile, type)
                .map(otp -> {
                    if (otp.getExpiresAt().isBefore(LocalDateTime.now())) return false;
                    if (!otp.getCode().equals(code)) return false;
                    otp.setUsed(true);
                    otpRepository.save(otp);
                    return true;
                })
                .orElse(false);
    }
}