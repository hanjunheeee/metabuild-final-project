package com.example.ex02.Title.repository;

import com.example.ex02.Title.entity.UserTitleEntity;
import com.example.ex02.Title.entity.UserTitleEntity.TitleLevel;
import com.example.ex02.Title.entity.UserTitleEntity.TitleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserTitleRepository extends JpaRepository<UserTitleEntity, Long> {

    // 특정 사용자의 모든 칭호 조회 (달성순 정렬)
    List<UserTitleEntity> findByUser_UserIdOrderByAchievedAtDesc(Long userId);

    // 특정 사용자의 특정 타입 칭호 조회
    List<UserTitleEntity> findByUser_UserIdAndTitleTypeOrderByTitleLevelDesc(Long userId, TitleType titleType);

    // 특정 사용자가 특정 타입의 특정 레벨 칭호를 가지고 있는지 확인
    boolean existsByUser_UserIdAndTitleTypeAndTitleLevel(Long userId, TitleType titleType, TitleLevel titleLevel);

    // 특정 사용자의 특정 타입 최고 레벨 칭호 조회
    @Query("SELECT t FROM UserTitleEntity t WHERE t.user.userId = :userId AND t.titleType = :titleType ORDER BY t.titleLevel DESC")
    List<UserTitleEntity> findTopTitleByUserAndType(@Param("userId") Long userId, @Param("titleType") TitleType titleType);

    // 특정 사용자의 최고 레벨 칭호들 조회 (타입별 최고 1개씩, 레벨 높은 순 → 최근 획득 순)
    @Query(value = """
        SELECT * FROM user_title t1 
        WHERE t1.user_id = :userId 
        AND NOT EXISTS (
            SELECT 1 FROM user_title t2 
            WHERE t2.user_id = t1.user_id 
            AND t2.title_type = t1.title_type 
            AND CASE t2.title_level 
                WHEN 'GOLD' THEN 3 
                WHEN 'SILVER' THEN 2 
                WHEN 'BRONZE' THEN 1 
                ELSE 0 END 
            > CASE t1.title_level 
                WHEN 'GOLD' THEN 3 
                WHEN 'SILVER' THEN 2 
                WHEN 'BRONZE' THEN 1 
                ELSE 0 END
        )
        ORDER BY CASE t1.title_level 
            WHEN 'GOLD' THEN 3 
            WHEN 'SILVER' THEN 2 
            WHEN 'BRONZE' THEN 1 
            ELSE 0 END DESC, t1.achieved_at DESC
        """, nativeQuery = true)
    List<UserTitleEntity> findTopTitlesByUser(@Param("userId") Long userId);
}

