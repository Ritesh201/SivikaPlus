package com.multimart.order.controller;

import com.multimart.order.dto.OrderDto.*;
import com.multimart.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // ---- Cart ----

    @GetMapping("/cart")
    public ResponseEntity<CartResponse> getCart(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(orderService.getCart(user.getUsername()));
    }

    @PostMapping("/cart/add")
    public ResponseEntity<CartResponse> addToCart(@AuthenticationPrincipal UserDetails user,
                                                  @Valid @RequestBody AddToCartRequest req) {
        return ResponseEntity.ok(orderService.addToCart(user.getUsername(), req));
    }

    @PutMapping("/cart/{cartItemId}")
    public ResponseEntity<CartResponse> updateCart(@AuthenticationPrincipal UserDetails user,
                                                   @PathVariable UUID cartItemId,
                                                   @RequestParam int quantity) {
        return ResponseEntity.ok(orderService.updateCartItem(user.getUsername(), cartItemId, quantity));
    }

    @DeleteMapping("/cart/{cartItemId}")
    public ResponseEntity<Void> removeFromCart(@AuthenticationPrincipal UserDetails user,
                                               @PathVariable UUID cartItemId) {
        orderService.removeFromCart(user.getUsername(), cartItemId);
        return ResponseEntity.noContent().build();
    }

    // ---- Orders ----

    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> placeOrder(@AuthenticationPrincipal UserDetails user,
                                                    @Valid @RequestBody PlaceOrderRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.placeOrder(user.getUsername(), req));
    }

    @GetMapping("/orders")
    public ResponseEntity<Page<OrderResponse>> myOrders(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(orderService.getMyOrders(user.getUsername(), PageRequest.of(page, size)));
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(@AuthenticationPrincipal UserDetails user,
                                                  @PathVariable UUID orderId) {
        return ResponseEntity.ok(orderService.getOrder(user.getUsername(), orderId));
    }

    // ---- Addresses ----

    @GetMapping("/addresses")
    public ResponseEntity<List<AddressDto>> getAddresses(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(orderService.getAddresses(user.getUsername()));
    }

    @PostMapping("/addresses")
    public ResponseEntity<AddressDto> addAddress(@AuthenticationPrincipal UserDetails user,
                                                 @Valid @RequestBody CreateAddressRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.addAddress(user.getUsername(), req));
    }

    // ---- Seller ----

    @GetMapping("/seller/orders")
    public ResponseEntity<Page<SellerOrderDto>> sellerOrders(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(orderService.getSellerOrders(user.getUsername(), PageRequest.of(page, size)));
    }
}
