package com.example.ex02.Book.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
// 도서 기본 정보 DTO
public class BookDTO {

    private Long bookId;
    private String isbn;
    private String title;
    private String author;
    private String publisher;
    private LocalDate publishedDate;
    private String summary;
    private String imageUrl;
    private String ages;  // 아동 / 청소년 / 성인
    // BookDetail에서 가져오는 필드
    private String tag;
    private Integer borrowedAmount;
}
