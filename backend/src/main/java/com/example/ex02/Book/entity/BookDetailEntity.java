package com.example.ex02.Book.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "book_detail")
@Getter
@Setter
@NoArgsConstructor
public class BookDetailEntity {

    @Id
    @Column(name = "book_id")
    private Long bookId;

    @Column(length = 300)
    private String summary;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "book_id")
    private BookEntity book;
}

