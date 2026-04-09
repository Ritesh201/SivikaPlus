package com.sivikaplus.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

public class PaymentDto {

    @Data
    public static class CreateRequest {
        @NotNull
        private UUID orderId;
    }

    @Data
    public static class CreateResponse {
        private String razorpayOrderId;
        private BigDecimal amount;
        private String currency;
        private String keyId;
        private UUID orderId;
        private String orderNumber;
    }

    @Data
    public static class VerifyRequest {
        @NotBlank private String razorpayOrderId;
        @NotBlank private String razorpayPaymentId;
        @NotBlank private String razorpaySignature;
    }

    @Data
    public static class PaymentResponse {
        private UUID id;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private BigDecimal amount;
        private String currency;
        private String status;
        private String paymentMethod;
        private ZonedDateTime createdAt;
    }
}
