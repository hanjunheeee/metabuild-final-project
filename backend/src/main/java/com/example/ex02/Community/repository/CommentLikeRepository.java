package com.example.ex02.Community.repository;

import com.example.ex02.Community.entity.CommentLikeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLikeEntity, Long> {
    
    // 특정 사용자가 특정 댓글에 좋아요 했는지 확인
    Optional<CommentLikeEntity> findByUser_UserIdAndComment_CommentId(Long userId, Long commentId);
    
    // 특정 사용자가 특정 댓글에 좋아요 했는지 여부
    boolean existsByUser_UserIdAndComment_CommentId(Long userId, Long commentId);
    
    // 특정 사용자가 좋아요한 댓글 ID 목록 조회
    List<CommentLikeEntity> findByUser_UserId(Long userId);
    
    // 특정 댓글의 좋아요 삭제 (댓글 삭제 시)
    void deleteByComment_CommentId(Long commentId);
}

