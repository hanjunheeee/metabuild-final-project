package com.example.ex02.Library.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class LibraryBookDTO {

    private Long libraryBookId;
    private Long libraryId;
    private Long bookId;
    private String available;
    private LocalDate updatedAt;
}

