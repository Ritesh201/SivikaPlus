package com.sivikaplus.listing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

public class ListingDto {

    @Data
    public static class CreateRequest {
        @NotNull
        private UUID productId;

        @NotNull @DecimalMin("0.01")
        private BigDecimal price;

        private BigDecimal originalPrice;

        @NotNull @Min(0)
        private Integer stockQuantity;

        private String customDescription;
        private String sku;
    }

    @Data
    public static class UpdateRequest {
        @DecimalMin("0.01")
        private BigDecimal price;

        private BigDecimal originalPrice;

        @Min(0)
        private Integer stockQuantity;

        private String customDescription;
        private String sku;
        private Boolean active;
    }

    @Data
    public static class Response {
        private UUID id;
        private UUID productId;
        private String productName;
        private String productSlug;
        private String primaryImageUrl;
        private SellerInfo seller;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private Integer stockQuantity;
        private String customDescription;
        private String sku;
        private boolean active;
        private Integer totalSold;
        private ZonedDateTime createdAt;
        private ZonedDateTime updatedAt;
    }

    @Data
    public static class SellerInfo {
        private UUID id;
        private String businessName;
        private double rating;
        private String verificationStatus;
    }
}
