package com.example.ex02.Community.repository;

import com.example.ex02.Community.entity.CommunityLikeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
// 커뮤니티 좋아요 조회 리포지토리
public interface CommunityLikeRepository extends JpaRepository<CommunityLikeEntity, Long> {
    
    // 사용자가 해당 게시글에 좋아요 했는지 확인
    Optional<CommunityLikeEntity> findByUser_UserIdAndCommunity_CommunityId(Long userId, Long communityId);
    
    // 해당 게시글의 좋아요 수
    int countByCommunity_CommunityId(Long communityId);
    
    // 사용자가 해당 게시글에 좋아요 했는지 여부
    boolean existsByUser_UserIdAndCommunity_CommunityId(Long userId, Long communityId);
    
    // 해당 게시글의 모든 좋아요 삭제
    void deleteByCommunity_CommunityId(Long communityId);
    
    // 사용자가 좋아요한 모든 게시글 조회
    List<CommunityLikeEntity> findByUser_UserIdOrderByCreatedAtDesc(Long userId);
}

