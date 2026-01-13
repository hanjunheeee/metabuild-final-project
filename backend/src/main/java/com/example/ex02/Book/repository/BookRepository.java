package com.example.ex02.Book.repository;

import com.example.ex02.Book.entity.BookEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
// 도서 조회 리포지토리
public interface BookRepository extends JpaRepository<BookEntity, Long> {
    List<BookEntity> findByTitleContainingIgnoreCaseOrIsbnContainingOrAuthorContainingIgnoreCaseOrPublisherContainingIgnoreCase(
            String title,
            String isbn,
            String author,
            String publisher
    );
}

