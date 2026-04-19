package com.sivikaplus.auth.repository;

import com.sivikaplus.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.active = true")
    Optional<User> findActiveByEmail(String email);


    Optional<User> findByPhone(String phone);      // ← add this
    boolean existsByPhone(String phone);            // ← add this


}
