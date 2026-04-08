package com.multimart.product.repository;

import com.multimart.product.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findBySlug(String slug);

    @Query("""
        SELECT DISTINCT p FROM Product p
        LEFT JOIN FETCH p.images
        LEFT JOIN FETCH p.category
        WHERE p.active = true
        AND EXISTS (
            SELECT l FROM Listing l
            WHERE l.product = p
            AND l.active = true
            AND l.stockQuantity > 0
        )
    """)
    List<Product> findActiveProducts();

    Page<Product> findByCategoryIdAndActiveTrue(UUID categoryId, Pageable pageable);

    @Query("""
        SELECT p FROM Product p WHERE p.active = true AND (
            LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(p.brand) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%'))
        )
    """)
    Page<Product> search(@Param("q") String q, Pageable pageable);

    @Query("""
        SELECT p FROM Product p
        WHERE p.active = true
        AND p.minPrice IS NOT NULL
        AND p.maxPrice IS NOT NULL
        AND p.maxPrice > 0
        ORDER BY (1.0 - (p.minPrice / p.maxPrice)) DESC
    """)
    Page<Product> findTopDeals(Pageable pageable);
}
