package com.sivikaplus.settlement.repository;

import com.sivikaplus.settlement.model.Settlement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.UUID;

public interface SettlementRepository extends JpaRepository<Settlement, UUID> {

    Page<Settlement> findBySellerIdOrderByCreatedAtDesc(UUID sellerId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(s.netAmount), 0) FROM Settlement s WHERE s.seller.id = :id AND s.status = 'COMPLETED'")
    BigDecimal totalPaid(@Param("id") UUID sellerId);

    @Query("SELECT COALESCE(SUM(s.netAmount), 0) FROM Settlement s WHERE s.seller.id = :id AND s.status = 'PENDING'")
    BigDecimal totalPending(@Param("id") UUID sellerId);
}
