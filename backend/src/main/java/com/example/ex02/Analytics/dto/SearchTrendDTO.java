package com.example.ex02.Analytics.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
// 트렌드 집계 결과 DTO
public class SearchTrendDTO {
    
    // 워드클라우드용 키워드 트렌드
    private String text;    // 검색어 또는 책 제목
    private Long value;     // 검색 횟수
    
    // 인기 도서용 추가 필드 (선택적)
    private Long bookId;
    private String author;
    private String imageUrl;
    
    // 키워드 트렌드용 생성자
    public SearchTrendDTO(String text, Long value) {
        this.text = text;
        this.value = value;
    }
    
    // 인기 도서 트렌드용 생성자
    public SearchTrendDTO(Long bookId, String text, String author, String imageUrl, Long value) {
        this.bookId = bookId;
        this.text = text;
        this.author = author;
        this.imageUrl = imageUrl;
        this.value = value;
    }
}
