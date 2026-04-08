package com.multimart.product.controller;

import com.multimart.product.dto.ProductDto.*;
import com.multimart.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/products")
    public ResponseEntity<Page<Summary>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String dir) {

        // Whitelist allowed sort fields — prevents "createdAt,desc" injection
        // and also blocks SQL injection via sort param
        Set<String> allowed = Set.of("createdAt", "name", "minPrice", "maxPrice", "brand");
        String safeSortBy = allowed.contains(sort) ? sort : "createdAt";

        Sort s = dir.equalsIgnoreCase("asc")
                ? Sort.by(safeSortBy).ascending()
                : Sort.by(safeSortBy).descending();

        return ResponseEntity.ok(productService.getAll(PageRequest.of(page, size, s)));
    }

    @GetMapping("/products/search")
    public ResponseEntity<Page<Summary>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(productService.search(q, PageRequest.of(page, size)));
    }

    @GetMapping("/products/categories")
    public ResponseEntity<List<CategoryDto>> categories() {
        return ResponseEntity.ok(productService.getAllCategories());
    }

    @GetMapping("/products/{slug}")
    public ResponseEntity<Detail> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(productService.getBySlug(slug));
    }

    @GetMapping("/products/id/{id}")
    public ResponseEntity<Detail> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @GetMapping("/products/category/{categoryId}")
    public ResponseEntity<Page<Summary>> byCategory(
            @PathVariable UUID categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(productService.getByCategory(categoryId, PageRequest.of(page, size)));
    }


    @GetMapping("/recommendations")
    public ResponseEntity<Page<Summary>> deals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(productService.getTopDeals(PageRequest.of(page, size)));
    }

    @PostMapping("/admin/products")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Detail> create(@Valid @RequestBody CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(req));
    }

    @PatchMapping("/admin/products/{productId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> approveProduct(@PathVariable UUID productId) {
        productService.approveProduct(productId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/admin/products/{productId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> rejectProduct(@PathVariable UUID productId) {
        productService.rejectProduct(productId);
        return ResponseEntity.noContent().build();
    }

}
