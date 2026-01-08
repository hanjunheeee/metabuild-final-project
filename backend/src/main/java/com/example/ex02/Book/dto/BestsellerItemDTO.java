package com.example.ex02.Book.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BestsellerItemDTO {

    private String title;
    private String author;
    private String publisher;
    private String isbn13;
    private String cover;
    private String link;
}
