package com.example.ex02.Library.entity;

import com.example.ex02.Book.entity.BookEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "library_book")
@Getter
@Setter
@NoArgsConstructor
public class LibraryBookEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "library_book_id")
    private Long libraryBookId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "library_id", nullable = false)
    private LibraryEntity library;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private BookEntity book;

    @Column(length = 1)
    private String available = "Y";

    @Column(name = "updated_at")
    private LocalDate updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDate.now();
    }
}

