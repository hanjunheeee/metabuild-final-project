package com.example.ex02.Follow.repository;

import com.example.ex02.Follow.entity.FollowEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<FollowEntity, Long> {

    // 특정 팔로우 관계 조회
    Optional<FollowEntity> findByFollower_UserIdAndFollowing_UserId(Long followerId, Long followingId);

    // 팔로우 관계 존재 여부
    boolean existsByFollower_UserIdAndFollowing_UserId(Long followerId, Long followingId);

    // 내가 팔로잉하는 사람들 목록
    @Query("SELECT f FROM FollowEntity f JOIN FETCH f.following WHERE f.follower.userId = :userId ORDER BY f.createdAt DESC")
    List<FollowEntity> findFollowingByUserId(@Param("userId") Long userId);

    // 나를 팔로우하는 사람들 목록 (팔로워)
    @Query("SELECT f FROM FollowEntity f JOIN FETCH f.follower WHERE f.following.userId = :userId ORDER BY f.createdAt DESC")
    List<FollowEntity> findFollowersByUserId(@Param("userId") Long userId);

    // 팔로잉 수
    int countByFollower_UserId(Long userId);

    // 팔로워 수
    int countByFollowing_UserId(Long userId);

    // 팔로우 관계 삭제
    void deleteByFollower_UserIdAndFollowing_UserId(Long followerId, Long followingId);
}

