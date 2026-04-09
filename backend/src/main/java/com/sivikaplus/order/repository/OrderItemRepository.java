package com.sivikaplus.order.repository;

import com.sivikaplus.order.model.Order;
import com.sivikaplus.order.model.OrderItem;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {

    @Query("SELECT DISTINCT oi.order FROM OrderItem oi WHERE oi.seller.id = :sellerId ORDER BY oi.order.createdAt DESC")
    Page<Order> findOrdersBySellerIdOrderByCreatedAtDesc(@Param("sellerId") UUID sellerId, Pageable pageable);
    List<OrderItem> findByOrderId(UUID orderId);
}
