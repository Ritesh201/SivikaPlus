package com.sivikaplus.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public class ProductDto {

    @Data
    public static class CreateRequest {
        @NotBlank
        private String name;
        private String description;
        private String brand;
        private UUID categoryId;
    }

    @Data
    public static class Summary implements Serializable{
        private static final long serialVersionUID = 1L;
        private UUID id;
        private String name;
        private String slug;
        private String brand;
        private BigDecimal minPrice;
        private BigDecimal maxPrice;
        private int totalListings;
        private String primaryImageUrl;
        private String categoryName;
    }

    @Data
    public static class Detail implements Serializable{
        private UUID id;
        private String name;
        private String slug;
        private String description;
        private String brand;
        private CategoryDto category;
        private BigDecimal minPrice;
        private BigDecimal maxPrice;
        private int totalListings;
        private List<ImageDto> images;
        private ZonedDateTime createdAt;
    }

    @Data
    public static class CategoryDto implements Serializable {
        private UUID id;
        private String name;
        private String slug;
    }

    @Data
    public static class ImageDto {
        private UUID id;
        private String imageUrl;
        private String altText;
        private boolean primary;
        private int sortOrder;
    }

    @Data
    public static class SellerCreateRequest {
        @NotBlank
        private String name;
        private String description;
        private String brand;
        private UUID categoryId;
        // listing details
        @NotNull
        private BigDecimal price;
        private BigDecimal originalPrice;
        @NotNull
        private Integer stockQuantity;
        private String sku;
        private String customDescription;
    }

    @Data
    public static class SellerProductResponse {
        private UUID productId;
        private String productName;
        private String status; // PENDING
        private UUID listingId;
    }
}
