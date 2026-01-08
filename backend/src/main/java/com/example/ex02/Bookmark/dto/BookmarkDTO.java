package com.example.ex02.Bookmark.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class BookmarkDTO {

    private Long bookmarkId;
    private Long userId;
    private Long bookId;
    private LocalDate favoriteDate;
    
    // 책 정보 (조회 시 포함)
    private String bookTitle;
    private String bookAuthor;
    private String bookImageUrl;
}
