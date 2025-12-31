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
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

