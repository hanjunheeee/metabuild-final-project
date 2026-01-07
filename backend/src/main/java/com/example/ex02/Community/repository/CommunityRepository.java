package com.example.ex02.Community.repository;

import com.example.ex02.Community.entity.CommunityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommunityRepository extends JpaRepository<CommunityEntity, Long> {
    
    // 특정 사용자의 게시글 수
    int countByUser_UserId(Long userId);
}

