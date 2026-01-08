package com.example.ex02.Bookmark.repository;

import com.example.ex02.Bookmark.entity.BookmarkEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<BookmarkEntity, Long> {
    
    // 사용자의 특정 책 북마크 조회
    Optional<BookmarkEntity> findByUser_UserIdAndBook_BookId(Long userId, Long bookId);
    
    // 사용자의 특정 책 북마크 존재 여부
    boolean existsByUser_UserIdAndBook_BookId(Long userId, Long bookId);
    
    // 사용자의 북마크 목록 조회 (최신순)
    List<BookmarkEntity> findByUser_UserIdOrderByFavoriteDateDesc(Long userId);
    
    // 특정 책의 북마크 수
    long countByBook_BookId(Long bookId);
}
