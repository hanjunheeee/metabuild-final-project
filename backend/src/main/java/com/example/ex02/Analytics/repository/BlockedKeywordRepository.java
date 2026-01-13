package com.example.ex02.Analytics.repository;

import com.example.ex02.Analytics.entity.BlockedKeywordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlockedKeywordRepository extends JpaRepository<BlockedKeywordEntity, Long> {
    
    Optional<BlockedKeywordEntity> findByKeyword(String keyword);
    
    boolean existsByKeyword(String keyword);
    
    List<BlockedKeywordEntity> findAllByOrderByCreatedAtDesc();
}

