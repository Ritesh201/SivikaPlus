package com.sivikaplus.product.repository;

import com.sivikaplus.product.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByActiveTrue();
    Optional<Category> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
