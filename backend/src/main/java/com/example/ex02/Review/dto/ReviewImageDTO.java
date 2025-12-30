package com.example.ex02.Review.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class ReviewImageDTO {

    private Long imageId;
    private Long reviewId;
    private String imageUrl;
    private String originName;
    private LocalDate createdAt;
}

