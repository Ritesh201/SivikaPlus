package com.sivikaplus.seller.repository;

import com.sivikaplus.seller.model.SellerProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SellerProductRepository extends JpaRepository<SellerProduct, UUID> {
    Page<SellerProduct> findBySellerId(UUID sellerId, Pageable pageable);
    Optional<SellerProduct> findByIdAndSellerId(UUID id, UUID sellerId);
    boolean existsBySlug(String slug);
}
