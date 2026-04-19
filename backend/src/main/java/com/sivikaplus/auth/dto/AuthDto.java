package com.sivikaplus.auth.dto;

import com.sivikaplus.auth.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

public class AuthDto {

//    @Data
//    public static class RegisterRequest {
//        @NotBlank @Email
//        private String email;
//
//        @NotBlank @Size(min = 8)
//        private String password;
//
//        @NotBlank
//        private String fullName;
//
//        private String phone;
//
//        private User.Role role = User.Role.CUSTOMER;
//
//        // seller-only
//        private String businessName;
//        private String businessDescription;
//        private String gstin;
//    }

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
        private BigDecimal rating;
    }

    @Data
    public static class RefreshRequest {
        @NotBlank
        private String refreshToken;
    }



    // existing DTOs stay same, add these:

    @Data
    public static class SendOtpRequest {
        @NotBlank String mobile;
        @NotBlank String type; // REGISTRATION or FORGOT_PASSWORD
    }

    @Data
    public static class VerifyOtpRequest {
        @NotBlank String mobile;
        @NotBlank String code;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank String mobile;
        @NotBlank String code;
        @NotBlank @Size(min = 6) String newPassword;
    }

    // update RegisterRequest to include phone
    @Data
    public static class RegisterRequest {
        @NotBlank String fullName;
        @NotBlank @Email String email;
        @NotBlank @Size(min = 6) String password;
        @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian mobile number")
        String phone;
        User.Role role;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MessageResponse {
        private String message;
    }

}
