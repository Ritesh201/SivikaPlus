package com.sivikaplus.listing.controller;

import com.sivikaplus.listing.dto.ListingDto.*;
import com.sivikaplus.listing.service.ListingService;
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
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;

    // public
    @GetMapping("/api/products/{productId}/listings")
    public ResponseEntity<List<Response>> byProduct(@PathVariable UUID productId) {
        return ResponseEntity.ok(listingService.getByProduct(productId));
    }

    // seller
    @PostMapping("/api/seller/listings")
    public ResponseEntity<Response> create(@AuthenticationPrincipal UserDetails user,
                                           @Valid @RequestBody CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(listingService.create(user.getUsername(), req));
    }

    @GetMapping("/api/seller/listings")
    public ResponseEntity<Page<Response>> myListings(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(listingService.getBySellerEmail(user.getUsername(), PageRequest.of(page, size)));
    }

    @PutMapping("/api/seller/listings/{id}")
    public ResponseEntity<Response> update(@AuthenticationPrincipal UserDetails user,
                                           @PathVariable UUID id,
                                           @Valid @RequestBody UpdateRequest req) {
        return ResponseEntity.ok(listingService.update(user.getUsername(), id, req));
    }

    @DeleteMapping("/api/seller/listings/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserDetails user,
                                       @PathVariable UUID id) {
        listingService.delete(user.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
