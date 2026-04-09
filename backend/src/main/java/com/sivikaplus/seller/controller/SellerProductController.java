package com.sivikaplus.seller.controller;

import com.sivikaplus.order.dto.OrderDto;
import com.sivikaplus.order.service.OrderService;
import com.sivikaplus.product.dto.ProductDto;
import com.sivikaplus.seller.dto.SellerProductDto.*;
import com.sivikaplus.seller.service.SellerProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
public class SellerProductController {

    private final SellerProductService sellerProductService;
    private final OrderService orderService;

    // ---- Seller Products (own catalog) ----

    @GetMapping("/products")
    public ResponseEntity<Page<Response>> listProducts(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(sellerProductService.getAll(user.getUsername(), PageRequest.of(page, size)));
    }

    @GetMapping("/products/{productId}")
    public ResponseEntity<Response> getProduct(@AuthenticationPrincipal UserDetails user,
                                               @PathVariable UUID productId) {
        return ResponseEntity.ok(sellerProductService.getOne(user.getUsername(), productId));
    }

    @PostMapping("/products")
    public ResponseEntity<Response> createProduct(@AuthenticationPrincipal UserDetails user,
                                                  @Valid @RequestBody CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sellerProductService.create(user.getUsername(), req));
    }

    @PutMapping("/products/{productId}")
    public ResponseEntity<Response> updateProduct(@AuthenticationPrincipal UserDetails user,
                                                  @PathVariable UUID productId,
                                                  @RequestBody UpdateRequest req) {
        return ResponseEntity.ok(sellerProductService.update(user.getUsername(), productId, req));
    }

    @DeleteMapping("/products/{productId}")
    public ResponseEntity<Void> deleteProduct(@AuthenticationPrincipal UserDetails user,
                                              @PathVariable UUID productId) {
        sellerProductService.delete(user.getUsername(), productId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/orders/{orderItemId}/status")
    public ResponseEntity<Void> updateOrderStatus(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID orderItemId,
            @RequestBody OrderDto.UpdateStatusRequest req) {
        orderService.updateOrderItemStatus(user.getUsername(), orderItemId, req.getStatus());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/listings/with-product")
    public ResponseEntity<ProductDto.SellerProductResponse> createWithProduct(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody ProductDto.SellerCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sellerProductService.createProductAndListing(user.getUsername(), req));
    }

    // ---- Seller Orders ----

//    @GetMapping("/orders")
//    public ResponseEntity<Page<OrderItemDto>> myOrders(
//            @AuthenticationPrincipal UserDetails user,
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "20") int size) {
//        return ResponseEntity.ok(orderService.getSellerOrders(user.getUsername(), PageRequest.of(page, size)));
//    }
}
