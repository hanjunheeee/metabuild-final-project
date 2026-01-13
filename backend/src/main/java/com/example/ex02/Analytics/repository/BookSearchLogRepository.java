package com.example.ex02.Analytics.repository;

import com.example.ex02.Analytics.entity.BookSearchLogEntity;
import com.example.ex02.Analytics.entity.BookSearchLogEntity.ActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
// 검색/액션 로그 조회 리포지토리
public interface BookSearchLogRepository extends JpaRepository<BookSearchLogEntity, Long> {

    // 오래된 로그 삭제 (스케줄러용)
    @Modifying
    @Query("DELETE FROM BookSearchLogEntity b WHERE b.createdAt < :threshold")
    int deleteByCreatedAtBefore(@Param("threshold") LocalDateTime threshold);

    // 인기 검색어 조회 (SEARCH 타입만)
    @Query("""
        SELECT b.keyword, COUNT(b) as cnt
        FROM BookSearchLogEntity b
        WHERE b.actionType = 'SEARCH'
          AND b.keyword IS NOT NULL
          AND b.createdAt > :since
        GROUP BY b.keyword
        ORDER BY cnt DESC
        """)
    List<Object[]> findTopKeywords(@Param("since") LocalDateTime since);

    // 인기 도서 조회 (특정 액션 타입별)
    @Query("""
        SELECT b.book.bookId, b.book.title, b.book.author, b.book.imageUrl, COUNT(b) as cnt
        FROM BookSearchLogEntity b
        WHERE b.actionType = :actionType
          AND b.book IS NOT NULL
          AND b.createdAt > :since
        GROUP BY b.book.bookId, b.book.title, b.book.author, b.book.imageUrl
        ORDER BY cnt DESC
        """)
    List<Object[]> findTopBooksByAction(
        @Param("actionType") ActionType actionType, 
        @Param("since") LocalDateTime since
    );

    // 전체 인기 도서 조회 (모든 클릭 행동 합산)
    @Query("""
        SELECT b.book.bookId, b.book.title, b.book.author, b.book.imageUrl, COUNT(b) as cnt
        FROM BookSearchLogEntity b
        WHERE b.actionType IN ('PURCHASE_VIEW', 'LIBRARY_SEARCH', 'AI_SUMMARY')
          AND b.book IS NOT NULL
          AND b.createdAt > :since
        GROUP BY b.book.bookId, b.book.title, b.book.author, b.book.imageUrl
        ORDER BY cnt DESC
        """)
    List<Object[]> findTopBooks(@Param("since") LocalDateTime since);
}
