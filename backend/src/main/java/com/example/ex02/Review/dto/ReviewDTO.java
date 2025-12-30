package com.example.ex02.Review.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class ReviewDTO {

    private Long reviewId;
    private Long userId;
    private Long bookId;
    private Double rating;
    private String contentJson;
    private String thumbnailUrl;
    private Integer reviewGreat;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}

