package com.example.ex02.Book.service;

import com.example.ex02.Book.entity.BookEntity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookUpsertService {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveIfAbsent(BookEntity book) {
        entityManager.createNativeQuery("""
            MERGE INTO book b
            USING (SELECT ? AS isbn FROM dual) src
            ON (b.isbn = src.isbn)
            WHEN NOT MATCHED THEN
              INSERT (isbn, title, author, publisher, image_url)
              VALUES (?, ?, ?, ?, ?)
        """)
            .setParameter(1, book.getIsbn())
            .setParameter(2, book.getIsbn())
            .setParameter(3, book.getTitle())
            .setParameter(4, book.getAuthor())
            .setParameter(5, book.getPublisher())
            .setParameter(6, book.getImageUrl())
            .executeUpdate();
    }
}
