package com.example.ex02.Community.repository;

import com.example.ex02.Community.entity.CommentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
// 커뮤니티 댓글 조회 리포지토리
public interface CommentRepository extends JpaRepository<CommentEntity, Long> {

    List<CommentEntity> findByCommunity_CommunityIdOrderByCreatedAtDesc(Long communityId);

    List<CommentEntity> findByUser_UserIdOrderByCreatedAtDesc(Long userId);

    int countByCommunity_CommunityId(Long communityId);
    
    // 해당 댓글에 답글이 있는지 확인
    boolean existsByParent_CommentId(Long parentId);
    
    // 부모 댓글의 답글 삭제
    void deleteByParent_CommentId(Long parentId);
    
    // 부모 댓글만 페이징 조회 (parentId가 null인 것만)
    Page<CommentEntity> findByCommunity_CommunityIdAndParentIsNullOrderByCreatedAtDesc(Long communityId, Pageable pageable);
    
    // 부모 댓글 수 (페이징용)
    int countByCommunity_CommunityIdAndParentIsNull(Long communityId);
    
    // 특정 부모 댓글들의 답글 조회
    List<CommentEntity> findByParent_CommentIdIn(List<Long> parentIds);
    
    // 해당 게시글의 모든 댓글 삭제
    void deleteByCommunity_CommunityId(Long communityId);
    
    // 특정 사용자가 받은 총 댓글 좋아요 수 (칭호 시스템용)
    @Query("SELECT SUM(c.likeCount) FROM CommentEntity c WHERE c.user.userId = :userId")
    Integer sumLikeCountByUserId(@Param("userId") Long userId);
}

