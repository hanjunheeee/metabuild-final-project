package com.example.ex02.Library.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "library")
@Getter
@Setter
@NoArgsConstructor
public class LibraryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "library_id")
    private Long libraryId;

    @Column(name = "library_name", nullable = false, length = 100)
    private String libraryName;

    @Column(name = "library_locate_la")
    private Double libraryLocateLa;

    @Column(name = "library_locate_lo")
    private Double libraryLocateLo;
}

