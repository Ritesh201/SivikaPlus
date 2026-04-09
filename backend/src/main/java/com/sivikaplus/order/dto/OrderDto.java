package com.sivikaplus.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public class OrderDto {

    @Data
    public static class AddToCartRequest {
        @NotNull
        private UUID listingId;
        @NotNull @Min(1)
        private Integer quantity;
    }

    @Data
    public static class CartResponse {
        private List<CartItemDto> items;
        private BigDecimal subtotal;
        private int totalItems;
    }

    @Data
    public static class CartItemDto {
        private UUID id;
        private UUID listingId;
        private UUID productId;
        private String productName;
        private String productSlug;
        private String imageUrl;
        private String sellerName;
        private BigDecimal price;
        private Integer quantity;
        private BigDecimal itemTotal;
        private Integer availableStock;
    }

    @Data
    public static class PlaceOrderRequest {
        @NotNull
        private UUID addressId;
        private String notes;
    }

    @Data
    public static class OrderResponse {
        private UUID id;
        private String orderNumber;
        private String status;
        private BigDecimal totalAmount;
        private BigDecimal discountAmount;
        private BigDecimal finalAmount;
        private List<OrderItemDto> items;
        private AddressDto address;
        private String notes;
        private ZonedDateTime createdAt;
        private ZonedDateTime updatedAt;
    }

    @Data
    public static class OrderItemDto {
        private UUID id;
        private UUID productId;
        private String productName;
        private String imageUrl;
        private String sellerName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
        private String status;
        private String trackingId;
    }

    @Data
    public static class AddressDto {
        private UUID id;
        private String fullName;
        private String phone;
        private String addressLine1;
        private String addressLine2;
        private String city;
        private String state;
        private String pincode;
        private String country;
        private boolean defaultAddress;
    }

    @Data
    public static class CreateAddressRequest {
        @NotNull private String fullName;
        @NotNull private String phone;
        @NotNull private String addressLine1;
        private String addressLine2;
        @NotNull private String city;
        @NotNull private String state;
        @NotNull private String pincode;
        private String country = "India";
        private boolean defaultAddress;
    }

    @Data
    public static class UpdateStatusRequest {
        private String status;
    }

    @Data
    public static class SellerOrderDto {
        private UUID orderId;
        private String orderNumber;
        private String orderStatus;
        private LocalDateTime createdAt;
        private BigDecimal orderTotal;
        private List<OrderItemDto> items;
    }
}
