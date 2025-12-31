package com.example.ex02.Community.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class CommunityImageDTO {

    private Long imageId;
    private Long communityId;
    private String imageUrl;
    private String originName;
    private LocalDate createdAt;
}

