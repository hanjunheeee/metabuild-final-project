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
        // MySQL 호환: INSERT IGNORE (isbn이 중복이면 무시)
        entityManager.createNativeQuery("""
            INSERT IGNORE INTO book (isbn, title, author, publisher, image_url)
            VALUES (?, ?, ?, ?, ?)
        """)
            .setParameter(1, book.getIsbn())
            .setParameter(2, book.getTitle())
            .setParameter(3, book.getAuthor())
            .setParameter(4, book.getPublisher())
            .setParameter(5, book.getImageUrl())
            .executeUpdate();
    }
}
