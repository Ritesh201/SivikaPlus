package com.sivikaplus.sellerProfile.dto;

import lombok.Data;

public class SellerProfileDto {

    // ── Profile Response ─────────────────────────────
    @Data
    public static class ProfileResponse {
        private String id;
        private String userId;
        private String fullName;
        private String email;
        private String phone;
        private String profileImageUrl;
        private String businessName;
        private String businessDescription;
        private String gstin;
        private String verificationStatus;
        private double rating;
        private int totalRatings;
        private BankDetails bankDetails;
    }

    // ── Update Profile Request ───────────────────────
    @Data
    public static class UpdateProfileRequest {
        private String businessName;
        private String businessDescription;
        private String gstin;
    }

    // ── Bank Details (response) ──────────────────────
    @Data
    public static class BankDetails {
        private String accountHolderName;
        private String accountNumber;   // masked in response
        private String ifscCode;
        private String bankName;
    }

    // ── Update Bank Details Request ──────────────────
    @Data
    public static class UpdateBankRequest {
        private String accountHolderName;
        private String accountNumber;
        private String ifscCode;
        private String bankName;
    }
}
