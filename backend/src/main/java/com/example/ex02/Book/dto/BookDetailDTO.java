package com.example.ex02.Book.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BookDetailDTO {

    private Long bookId;
    private String summary;
}

