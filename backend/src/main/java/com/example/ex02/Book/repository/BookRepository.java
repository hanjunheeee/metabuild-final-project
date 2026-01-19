package com.example.ex02.Book.repository;

import com.example.ex02.Book.entity.BookEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("""
        SELECT b FROM BookEntity b
        WHERE lower(function('replace', b.title, ' ', '')) LIKE lower(concat('%', :normalized, '%'))
           OR lower(function('replace', b.author, ' ', '')) LIKE lower(concat('%', :normalized, '%'))
           OR lower(function('replace', b.publisher, ' ', '')) LIKE lower(concat('%', :normalized, '%'))
           OR lower(function('replace', b.isbn, ' ', '')) LIKE lower(concat('%', :normalized, '%'))
    """)
    List<BookEntity> findByNormalizedKeyword(@Param("normalized") String normalized);

    @Query("""
        SELECT count(b) > 0 FROM BookEntity b
        WHERE lower(function('replace', function('replace', b.isbn, '-', ''), ' ', '')) =
              lower(function('replace', function('replace', :isbn, '-', ''), ' ', ''))
    """)
    boolean existsByIsbnNormalized(@Param("isbn") String isbn);
}

