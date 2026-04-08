package com.multimart.seller.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.ZonedDateTime;
import java.util.UUID;

public class SellerProductDto {

    @Data
    public static class CreateRequest {
        @NotBlank
        private String name;
        private String description;
        private String brand;
        private UUID categoryId;
    }

    @Data
    public static class UpdateRequest {
        private String name;
        private String description;
        private String brand;
        private UUID categoryId;
        private Boolean active;
    }

    @Data
    public static class Response {
        private UUID id;
        private String name;
        private String slug;
        private String description;
        private String brand;
        private String categoryName;
        private boolean active;
        private ZonedDateTime createdAt;
        private ZonedDateTime updatedAt;
    }
}
