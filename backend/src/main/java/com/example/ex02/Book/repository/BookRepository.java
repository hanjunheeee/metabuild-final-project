package com.example.ex02.Book.repository;

import com.example.ex02.Book.entity.BookEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<BookEntity, Long> {
    List<BookEntity> findByTitleContainingIgnoreCaseOrIsbnContaining(String title, String isbn);
    
    // 제목, ISBN, 작가명으로 검색
    List<BookEntity> findByTitleContainingIgnoreCaseOrIsbnContainingOrAuthorContainingIgnoreCase(
            String title, String isbn, String author);
}

