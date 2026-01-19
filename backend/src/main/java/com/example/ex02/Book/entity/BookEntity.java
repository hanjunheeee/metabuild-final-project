package com.example.ex02.Book.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "book")
@Getter
@Setter
@NoArgsConstructor
// 도서 기본 엔티티
public class BookEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "book_id")
    private Long bookId;

    @Column(length = 20)
    private String isbn;

    @Column(length = 200)
    private String title;

    @Column(length = 500)
    private String author;

    @Column(length = 100)
    private String publisher;

    @Column(name = "published_date")
    private LocalDate publishedDate;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(length = 20)
    private String ages;
}
