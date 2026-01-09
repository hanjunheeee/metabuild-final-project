package com.example.ex02.Book.service;

import com.example.ex02.Book.dto.BookDTO;
import com.example.ex02.Book.entity.BookEntity;
import com.example.ex02.Book.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;

    // 전체 도서 조회
    public List<BookDTO> getAllBooks() {
        return bookRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<BookDTO> searchBooks(String query) {
        String trimmed = query == null ? "" : query.trim();
        if (trimmed.isEmpty()) {
            return getAllBooks();
        }

        return bookRepository.findByTitleContainingIgnoreCaseOrIsbnContaining(trimmed, trimmed).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // 도서 ID로 조회
    public BookDTO getBookById(Long id) {
        BookEntity book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
        return convertToDTO(book);
    }

    // Entity -> DTO 변환
    private BookDTO convertToDTO(BookEntity book) {
        BookDTO dto = new BookDTO();
        dto.setBookId(book.getBookId());
        dto.setIsbn(book.getIsbn());
        dto.setTitle(book.getTitle());
        dto.setAuthor(book.getAuthor());
        dto.setPublisher(book.getPublisher());
        dto.setPublishedDate(book.getPublishedDate());
        dto.setSummary(book.getSummary());
        dto.setImageUrl(book.getImageUrl());
        dto.setAges(book.getAges() != null ? book.getAges().name() : null);
        
        // BookDetail에서 가져오는 필드
        if (book.getBookDetail() != null) {
            dto.setTag(book.getBookDetail().getTag());
            dto.setBorrowedAmount(book.getBookDetail().getBorrowedAmount());
        }
        return dto;
    }
}
