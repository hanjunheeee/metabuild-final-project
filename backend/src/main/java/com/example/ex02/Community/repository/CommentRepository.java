package com.example.ex02.Community.repository;

import com.example.ex02.Community.entity.CommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<CommentEntity, Long> {

    List<CommentEntity> findByCommunity_CommunityIdOrderByCreatedAtDesc(Long communityId);

    List<CommentEntity> findByUser_UserIdOrderByCreatedAtDesc(Long userId);

    int countByCommunity_CommunityId(Long communityId);
}

