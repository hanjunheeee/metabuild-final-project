package com.example.ex02.Community.repository;

import com.example.ex02.Community.entity.CommunityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
// 커뮤니티 게시글 조회 리포지토리
public interface CommunityRepository extends JpaRepository<CommunityEntity, Long> {
    
    // 특정 사용자의 게시글 수
    int countByUser_UserId(Long userId);
    
    // 주간 HOT 게시글 조회 (최근 7일 내 작성, 좋아요 순, 공지 제외)
    @Query("SELECT c FROM CommunityEntity c " +
           "WHERE c.createdAt >= :startDate " +
           "AND (c.isNotice IS NULL OR c.isNotice = 0) " +
           "ORDER BY c.communityGreat DESC, c.createdAt DESC")
    List<CommunityEntity> findWeeklyHotPosts(@Param("startDate") LocalDateTime startDate);
}
