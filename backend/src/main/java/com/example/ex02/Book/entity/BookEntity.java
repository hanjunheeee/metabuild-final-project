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
public class BookEntity {

    public enum AgeGroup {
        아동, 청소년, 성인
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "book_id")
    private Long bookId;

    @Column(length = 20)
    private String isbn;

    @Column(length = 200)
    private String title;

    @Column(length = 100)
    private String author;

    @Column(length = 100)
    private String publisher;

    @Column(name = "published_date")
    private LocalDate publishedDate;

    @Column(length = 300)
    private String summary;

    @Column(name = "image_url", length = 100)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private AgeGroup ages;

    @OneToOne(mappedBy = "book", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private BookDetailEntity bookDetail;
}

