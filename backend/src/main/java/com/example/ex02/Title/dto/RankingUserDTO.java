package com.example.ex02.Title.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RankingUserDTO {
    private int rank;
    private Long userId;
    private String nickname;
    private String userPhoto;
    private Long count;  // 좋아요 수 또는 팔로워 수
}

