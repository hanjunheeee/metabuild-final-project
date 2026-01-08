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

    @Column(length = 20)
    private String tag;

    @Column(name = "borrowed_amount")
    private Integer borrowedAmount;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "book_id")
    private BookEntity book;
}

