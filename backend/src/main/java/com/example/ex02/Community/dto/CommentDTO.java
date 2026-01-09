package com.example.ex02.Community.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class CommentDTO {

    private Long commentId;
    private Long communityId;
    private Long userId;
    private String userNickname;
    private String userProfileImage;  // 사용자 프로필 이미지
    private String content;
    private Long parentId;  // 부모 댓글 ID (답글인 경우에만 값 있음)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 댓글에 태그된 책 정보
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String bookImageUrl;
}

