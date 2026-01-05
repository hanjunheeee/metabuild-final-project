package com.example.ex02.Community.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CommunityCreateDTO {

    private Long userId;          // 작성자 ID
    private Long bookId;          // 책 ID (선택)
    private String title;         // 제목
    private String content;       // 내용 (HTML)
    private String communityKind; // 게시판 종류 (FREE, QUESTION, REVIEW)
    private String thumbnailUrl;  // 썸네일 URL (선택)
}

