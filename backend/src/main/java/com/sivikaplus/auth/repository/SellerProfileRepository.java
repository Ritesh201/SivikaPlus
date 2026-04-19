package com.sivikaplus.auth.repository;

import com.sivikaplus.auth.model.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface SellerProfileRepository extends JpaRepository<SellerProfile, UUID> {
    Optional<SellerProfile> findByUserId(UUID userId);
    boolean existsByUserId(UUID userId);
    @Query("SELECT s.verificationStatus FROM SellerProfile s WHERE s.user.id = :userId")
    Optional<SellerProfile.VerificationStatus> findVerificationStatusByUserId(@Param("userId") UUID userId);
}
