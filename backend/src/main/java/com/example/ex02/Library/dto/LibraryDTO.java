package com.example.ex02.Library.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class LibraryDTO {

    private Long libraryId;
    private String libraryName;
    private Double libraryLocateLa;
    private Double libraryLocateLo;
}

