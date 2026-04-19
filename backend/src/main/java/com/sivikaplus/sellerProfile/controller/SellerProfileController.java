package com.sivikaplus.sellerProfile.controller;

import com.sivikaplus.auth.model.User;
import com.sivikaplus.sellerProfile.dto.SellerProfileDto;
import com.sivikaplus.sellerProfile.service.SellerProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller/profile")
@RequiredArgsConstructor
public class SellerProfileController {

    private final SellerProfileService sellerProfileService;

    /**
     * GET /seller/profile
     * Returns full profile with masked bank details
     */
    @GetMapping
    public ResponseEntity<SellerProfileDto.ProfileResponse> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sellerProfileService.getProfile(userDetails));
    }

    /**
     * PUT /seller/profile
     * Update business name, description, GSTIN
     */
    @PutMapping
    public ResponseEntity<SellerProfileDto.ProfileResponse> updateProfile(
            @AuthenticationPrincipal  UserDetails userDetails,
            @RequestBody SellerProfileDto.UpdateProfileRequest req) {
        return ResponseEntity.ok(sellerProfileService.updateProfile(userDetails, req));
    }

    /**
     * PUT /seller/profile/bank-details
     * Update bank account details
     */
    @PutMapping("/bank-details")
    public ResponseEntity<SellerProfileDto.ProfileResponse> updateBankDetails(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody SellerProfileDto.UpdateBankRequest req) {
        return ResponseEntity.ok(sellerProfileService.updateBankDetails(userDetails, req));
    }
}
