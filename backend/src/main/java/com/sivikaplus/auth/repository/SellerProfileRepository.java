package com.sivikaplus.auth.repository;

import com.sivikaplus.auth.model.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SellerProfileRepository extends JpaRepository<SellerProfile, UUID> {
    Optional<SellerProfile> findByUserId(UUID userId);
    boolean existsByUserId(UUID userId);
}
