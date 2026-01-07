package com.example.ex02.Follow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowDTO {
    private Long followId;
    private Long userId;
    private String nickname;
    private String userPhoto;
    private String email;
    private Integer postCount;      // 게시글 수
    private Integer followerCount;  // 팔로워 수
    private Boolean isFollowing;    // 내가 이 사람을 팔로우 중인지
    private LocalDateTime createdAt;
}

