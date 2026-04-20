package com.stockfolio.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.stockfolio.user.domain.User;
import java.util.Optional;


public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);

    // 로그인
    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    boolean existsByEmail(String email);

    // 이메일 중복 확인
    boolean existsByEmailAndDeletedAtIsNull(String email);
}
