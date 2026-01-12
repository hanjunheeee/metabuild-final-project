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

        // 제목, ISBN, 작가명으로 검색
        return bookRepository.findByTitleContainingIgnoreCaseOrIsbnContainingOrAuthorContainingIgnoreCase(
                trimmed, trimmed, trimmed).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // 도서 ID로 조회
    public BookDTO getBookById(Long id) {
        BookEntity book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
        return convertToDTO(book);
    }

    // ========================================
    // 도서 생성
    // ========================================
    @Transactional
    public BookDTO createBook(BookDTO dto) {
        BookEntity book = new BookEntity();
        updateEntityFromDTO(book, dto);
        BookEntity saved = bookRepository.save(book);
        return convertToDTO(saved);
    }

    // ========================================
    // 도서 수정
    // ========================================
    @Transactional
    public BookDTO updateBook(Long id, BookDTO dto) {
        BookEntity book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
        updateEntityFromDTO(book, dto);
        BookEntity saved = bookRepository.save(book);
        return convertToDTO(saved);
    }

    // ========================================
    // 도서 삭제
    // ========================================
    @Transactional
    public void deleteBook(Long id) {
        if (!bookRepository.existsById(id)) {
            throw new RuntimeException("Book not found with id: " + id);
        }
        bookRepository.deleteById(id);
    }

    // DTO -> Entity 필드 업데이트
    private void updateEntityFromDTO(BookEntity book, BookDTO dto) {
        book.setIsbn(dto.getIsbn());
        book.setTitle(dto.getTitle());
        book.setAuthor(dto.getAuthor());
        book.setPublisher(dto.getPublisher());
        book.setPublishedDate(dto.getPublishedDate());
        book.setSummary(dto.getSummary());
        book.setImageUrl(dto.getImageUrl());
        if (dto.getAges() != null && !dto.getAges().isEmpty()) {
            try {
                book.setAges(BookEntity.AgeGroup.valueOf(dto.getAges()));
            } catch (IllegalArgumentException e) {
                book.setAges(null);
            }
        } else {
            book.setAges(null);
        }
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
