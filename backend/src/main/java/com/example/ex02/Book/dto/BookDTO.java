package com.example.ex02.Book.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class BookDTO {

    private Long bookId;
    private String isbn;
    private String title;
    private String author;
    private String publisher;
    private LocalDate publishedDate;
    private LocalDate createdAt;
    private String tag;
    private String summary;
    private Integer borrowedAmount;
}

