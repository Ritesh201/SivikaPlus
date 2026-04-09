package com.sivikaplus.listing.repository;

import com.sivikaplus.listing.model.Listing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ListingRepository extends JpaRepository<Listing, UUID> {

    List<Listing> findByProductIdAndActiveTrueAndStockQuantityGreaterThanOrderByPriceAsc(UUID productId,int quantity);

    Page<Listing> findBySellerIdAndActiveTrue(UUID sellerId, Pageable pageable);

    boolean existsBySellerIdAndProductId(UUID sellerId, UUID productId);

    Optional<Listing> findBySellerIdAndProductId(UUID sellerId, UUID productId);

    @Query("SELECT MIN(l.price) FROM Listing l WHERE l.product.id = :id AND l.active = true AND l.stockQuantity > 0")
    Optional<BigDecimal> findMinPrice(@Param("id") UUID productId);

    @Query("SELECT MAX(l.price) FROM Listing l WHERE l.product.id = :id AND l.active = true")
    Optional<BigDecimal> findMaxPrice(@Param("id") UUID productId);

    @Query("SELECT COUNT(l) FROM Listing l WHERE l.product.id = :id AND l.active = true")
    long countActive(@Param("id") UUID productId);

    List<Listing> findByProductId(UUID productId);
}
