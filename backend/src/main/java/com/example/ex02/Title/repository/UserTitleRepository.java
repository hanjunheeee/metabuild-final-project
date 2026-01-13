package com.example.ex02.Title.repository;

import com.example.ex02.Title.entity.UserTitleEntity;
import com.example.ex02.Title.entity.UserTitleEntity.TitleLevel;
import com.example.ex02.Title.entity.UserTitleEntity.TitleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

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

    // 특정 사용자의 최고 레벨 칭호들 조회 (타입별 최고 1개씩)
    @Query("SELECT t FROM UserTitleEntity t WHERE t.user.userId = :userId AND t.titleLevel = " +
           "(SELECT MAX(t2.titleLevel) FROM UserTitleEntity t2 WHERE t2.user.userId = :userId AND t2.titleType = t.titleType)")
    List<UserTitleEntity> findTopTitlesByUser(@Param("userId") Long userId);
}

