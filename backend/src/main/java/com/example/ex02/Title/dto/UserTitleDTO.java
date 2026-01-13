package com.example.ex02.Title.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTitleDTO {

    private Long titleId;
    private Long userId;
    private String titleType;      // LIKE, FOLLOWER
    private String titleLevel;     // BRONZE, SILVER, GOLD
    private String titleName;      // 공감의 시작, 도서 큐레이터 등
    private String titleIcon;      // 💭, 📚 등
    private LocalDateTime achievedAt;

    // 추가 정보 (프론트엔드 표시용)
    private String description;    // 칭호 설명
    private int requiredCount;     // 달성 조건 (100, 1000, 2000 등)
}

