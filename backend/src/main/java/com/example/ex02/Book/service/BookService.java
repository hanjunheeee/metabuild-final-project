package com.example.ex02.Book.service;

import com.example.ex02.Book.dto.BookDTO;
import com.example.ex02.Book.entity.BookEntity;
import com.example.ex02.Book.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;

    // 도서 전체 조회
    public List<BookDTO> getAllBooks() {
        return bookRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // 제목/ISBN/저자/출판사 검색(복수 키워드 지원)
    public List<BookDTO> searchBooks(String query) {
        String trimmed = query == null ? "" : query.trim();
        if (trimmed.isEmpty()) {
            return getAllBooks();
        }

        List<String> tokens = Arrays.stream(trimmed.split("\\s+"))
                .map(String::trim)
                .filter(token -> !token.isEmpty())
                .map(String::toLowerCase)
                .collect(Collectors.toList());
        if (tokens.isEmpty()) {
            return getAllBooks();
        }

        String firstToken = tokens.get(0);
        return bookRepository
                .findByTitleContainingIgnoreCaseOrIsbnContainingOrAuthorContainingIgnoreCaseOrPublisherContainingIgnoreCase(
                        firstToken, firstToken, firstToken, firstToken)
                .stream()
                .filter(book -> matchesAllTokens(book, tokens))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // 도서 ID 조회
    public BookDTO getBookById(Long id) {
        BookEntity book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
        return convertToDTO(book);
    }

    // 도서 생성
    @Transactional
    public BookDTO createBook(BookDTO dto) {
        BookEntity book = new BookEntity();
        updateEntityFromDTO(book, dto);
        BookEntity saved = bookRepository.save(book);
        return convertToDTO(saved);
    }

    // 도서 수정
    @Transactional
    public BookDTO updateBook(Long id, BookDTO dto) {
        BookEntity book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
        updateEntityFromDTO(book, dto);
        BookEntity saved = bookRepository.save(book);
        return convertToDTO(saved);
    }

    // 도서 삭제
    @Transactional
    public void deleteBook(Long id) {
        if (!bookRepository.existsById(id)) {
            throw new RuntimeException("Book not found with id: " + id);
        }
        bookRepository.deleteById(id);
    }

    // DTO -> Entity 필드 매핑
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

        if (book.getBookDetail() != null) {
            dto.setTag(book.getBookDetail().getTag());
            dto.setBorrowedAmount(book.getBookDetail().getBorrowedAmount());
        }
        return dto;
    }

    private boolean matchesAllTokens(BookEntity book, List<String> tokens) {
        String title = safeLower(book.getTitle());
        String author = safeLower(book.getAuthor());
        String isbn = safeLower(book.getIsbn());
        String publisher = safeLower(book.getPublisher());

        for (String token : tokens) {
            if (token.isEmpty()) continue;
            boolean matches = title.contains(token)
                    || author.contains(token)
                    || isbn.contains(token)
                    || publisher.contains(token);
            if (!matches) {
                return false;
            }
        }
        return true;
    }

    private String safeLower(String value) {
        return value == null ? "" : value.toLowerCase();
    }
}

