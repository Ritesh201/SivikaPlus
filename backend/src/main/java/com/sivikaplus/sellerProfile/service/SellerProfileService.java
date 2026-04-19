package com.sivikaplus.sellerProfile.service;

import com.sivikaplus.auth.model.SellerProfile;
import com.sivikaplus.auth.model.User;
import com.sivikaplus.auth.repository.UserRepository;
import com.sivikaplus.exception.ResourceNotFoundException;

import com.sivikaplus.auth.repository.SellerProfileRepository;
import com.sivikaplus.sellerProfile.dto.SellerProfileDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SellerProfileService {

    private final SellerProfileRepository sellerProfileRepository;
    private final UserRepository userRepository;

    // ── Get Profile ──────────────────────────────────
    public SellerProfileDto.ProfileResponse getProfile(UserDetails userDetails) {
        String email = userDetails.getUsername();
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));
        SellerProfile sp = sellerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found"));
        return toResponse(sp, user);
    }

    // ── Update Business Profile ──────────────────────
    @Transactional
    public SellerProfileDto.ProfileResponse updateProfile(UserDetails userDetails, SellerProfileDto.UpdateProfileRequest req) {
        String email = userDetails.getUsername();
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));
        SellerProfile sp = sellerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found"));

        if (req.getBusinessName() != null)        sp.setBusinessName(req.getBusinessName());
        if (req.getBusinessDescription() != null) sp.setBusinessDescription(req.getBusinessDescription());
        if (req.getGstin() != null)               sp.setGstin(req.getGstin());

        return toResponse(sellerProfileRepository.save(sp), user);
    }

    // ── Update Bank Details ──────────────────────────
    @Transactional
    public SellerProfileDto.ProfileResponse updateBankDetails(UserDetails userDetails, SellerProfileDto.UpdateBankRequest req) {
        String email = userDetails.getUsername();
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));
        SellerProfile sp = sellerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found"));

        if (req.getAccountHolderName() != null) sp.setBankAccountHolderName(req.getAccountHolderName());
        if (req.getAccountNumber() != null)     sp.setBankAccountNumber(req.getAccountNumber());
        if (req.getIfscCode() != null)          sp.setBankIfscCode(req.getIfscCode());
        if (req.getBankName() != null)          sp.setBankName(req.getBankName());

        log.info("Bank details updated for seller: {}", user.getId());
        return toResponse(sellerProfileRepository.save(sp), user);
    }

    // ── Mapper ───────────────────────────────────────
    private SellerProfileDto.ProfileResponse toResponse(SellerProfile sp, User user) {
        SellerProfileDto.ProfileResponse r = new SellerProfileDto.ProfileResponse();
        r.setId(sp.getId().toString());
        r.setUserId(user.getId().toString());
        r.setFullName(user.getFullName());
        r.setEmail(user.getEmail());
        r.setPhone(user.getPhone());
        r.setProfileImageUrl(user.getProfileImageUrl());
        r.setBusinessName(sp.getBusinessName());
        r.setBusinessDescription(sp.getBusinessDescription());
        r.setGstin(sp.getGstin());
        r.setVerificationStatus(sp.getVerificationStatus() != null
                ? sp.getVerificationStatus().name() : "PENDING");
        r.setRating(sp.getRating().doubleValue());
        r.setTotalRatings(sp.getTotalRatings());

        SellerProfileDto.BankDetails bank = new SellerProfileDto.BankDetails();
        bank.setAccountHolderName(sp.getBankAccountHolderName());
        bank.setAccountNumber(maskAccountNumber(sp.getBankAccountNumber()));
        bank.setIfscCode(sp.getBankIfscCode());
        bank.setBankName(sp.getBankName());
        r.setBankDetails(bank);

        return r;
    }

    // masks all but last 4 digits e.g. ******1234
    private String maskAccountNumber(String number) {
        if (number == null || number.length() < 4) return number;
        return "*".repeat(number.length() - 4) + number.substring(number.length() - 4);
    }
}
