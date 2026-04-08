package com.multimart.auth.dto;

import com.multimart.auth.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDto {

    @Data
    public static class RegisterRequest {
        @NotBlank @Email
        private String email;

        @NotBlank @Size(min = 8)
        private String password;

        @NotBlank
        private String fullName;

        private String phone;

        private User.Role role = User.Role.CUSTOMER;

        // seller-only
        private String businessName;
        private String businessDescription;
        private String gstin;
    }

    @Data
    public static class LoginRequest {
        @NotBlank @Email
        private String email;

        @NotBlank
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private long expiresIn;
        private UserDto user;
    }

    @Data
    public static class UserDto {
        private String id;
        private String email;
        private String fullName;
        private String role;
        private boolean verified;
        private String profileImageUrl;
        private SellerDto sellerProfile;
    }

    @Data
    public static class SellerDto {
        private String id;
        private String businessName;
        private String verificationStatus;
        private double rating;
    }

    @Data
    public static class RefreshRequest {
        @NotBlank
        private String refreshToken;
    }
}
