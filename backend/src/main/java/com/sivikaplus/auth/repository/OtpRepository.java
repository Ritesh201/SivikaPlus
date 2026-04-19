package com.sivikaplus.auth.repository;

import com.sivikaplus.auth.model.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpRepository extends JpaRepository<Otp, UUID> {

    void deleteByMobileAndType(String mobile, String type);

    Optional<Otp> findTopByMobileAndTypeAndUsedFalseOrderByCreatedAtDesc(String mobile, String type);
}
