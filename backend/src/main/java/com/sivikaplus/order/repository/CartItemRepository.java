package com.sivikaplus.order.repository;

import com.sivikaplus.order.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    List<CartItem> findByUserId(UUID userId);
    Optional<CartItem> findByUserIdAndListingId(UUID userId, UUID listingId);
    void deleteByUserId(UUID userId);
}
