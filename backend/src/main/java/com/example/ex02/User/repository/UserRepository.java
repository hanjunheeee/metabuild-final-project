package com.example.ex02.User.repository;

import com.example.ex02.User.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    
    // 이메일로 사용자 조회
    Optional<UserEntity> findByEmail(String email);
    
    // 이메일 존재 여부 확인
    boolean existsByEmail(String email);
}

