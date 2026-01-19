package com.example.ex02.Title.repository;

import com.example.ex02.User.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RankingRepository extends JpaRepository<UserEntity, Long> {

    /**
     * 댓글 좋아요 TOP N 조회
     * 각 유저가 받은 댓글 좋아요 총합 기준 내림차순 정렬
     */
    @Query(value = """
        SELECT u.user_id, u.nickname, u.user_photo, IFNULL(SUM(c.like_count), 0) as total_likes
        FROM users u
        LEFT JOIN comments c ON u.user_id = c.user_id
        WHERE u.role = 'USER' AND u.is_active = 'Y'
        GROUP BY u.user_id, u.nickname, u.user_photo
        HAVING IFNULL(SUM(c.like_count), 0) > 0
        ORDER BY total_likes DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTopUsersByCommentLikes(@Param("limit") int limit);

    /**
     * 팔로워 TOP N 조회
     * 각 유저의 팔로워 수 기준 내림차순 정렬
     */
    @Query(value = """
        SELECT u.user_id, u.nickname, u.user_photo, COUNT(f.follow_id) as follower_count
        FROM users u
        LEFT JOIN follow f ON u.user_id = f.following_id
        WHERE u.role = 'USER' AND u.is_active = 'Y'
        GROUP BY u.user_id, u.nickname, u.user_photo
        HAVING COUNT(f.follow_id) > 0
        ORDER BY follower_count DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTopUsersByFollowers(@Param("limit") int limit);
}

