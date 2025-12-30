package com.example.ex02.Bookmark.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class BookmarkDTO {

    private Long bookmarkId;
    private Long userId;
    private Long bookId;
    private LocalDate favoriteDate;
}

