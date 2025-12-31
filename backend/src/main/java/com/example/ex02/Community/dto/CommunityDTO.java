package com.example.ex02.Community.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class CommunityDTO {

    private Long communityId;
    private Long userId;
    private Long bookId;
    private String contentJson;
    private String thumbnailUrl;
    private Integer communityGreat;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}

