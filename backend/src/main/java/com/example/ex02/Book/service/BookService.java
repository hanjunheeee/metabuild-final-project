package com.example.ex02.Book.service;

import com.example.ex02.Book.dto.BookDTO;
import com.example.ex02.Book.dto.BestsellerItemDTO;
import com.example.ex02.Book.entity.BookEntity;
import com.example.ex02.Book.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;
    private final BookUpsertService bookUpsertService;

    // 도서 전체 조회
    public List<BookDTO> getAllBooks() {
        return bookRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void ensureBooksByIsbn(List<BestsellerItemDTO> items) {
        if (items == null || items.isEmpty()) {
            return;
        }

        for (BestsellerItemDTO item : items) {
            if (item == null) continue;
            String isbn = normalizeIsbn(item.getIsbn13());
            if (isbn.isBlank()) continue;
            if (bookRepository.existsByIsbnNormalized(isbn)) continue;

            BookEntity book = new BookEntity();
            book.setIsbn(isbn);
            book.setTitle(item.getTitle());
            book.setAuthor(item.getAuthor());
            book.setPublisher(item.getPublisher());
            book.setImageUrl(item.getCover());
            bookUpsertService.saveIfAbsent(book);
        }
    }

    // 제목/ISBN/저자/출판사 검색(복수 키워드 지원) - 최대 50개 제한
    private static final int MAX_SEARCH_RESULTS = 50;

    public List<BookDTO> searchBooks(String query) {
        String trimmed = query == null ? "" : query.trim();
        
        // 빈 검색어이거나 2글자 미만이면 빈 리스트 반환 (성능 최적화)
        if (trimmed.length() < 2) {
            return List.of();
        }

        List<String> tokens = Arrays.stream(trimmed.split("\\s+"))
                .map(String::trim)
                .filter(token -> !token.isEmpty())
                .map(String::toLowerCase)
                .collect(Collectors.toList());
        if (tokens.isEmpty()) {
            return List.of();
        }

        String firstToken = tokens.get(0);
        String normalized = trimmed.replaceAll("\\s+", "");

        List<BookEntity> initial = bookRepository
                .findByTitleContainingIgnoreCaseOrIsbnContainingOrAuthorContainingIgnoreCaseOrPublisherContainingIgnoreCase(
                        firstToken, firstToken, firstToken, firstToken);
        List<BookEntity> normalizedMatches = normalized.isEmpty()
                ? java.util.Collections.emptyList()
                : bookRepository.findByNormalizedKeyword(normalized.toLowerCase());

        return mergeCandidates(initial, normalizedMatches).stream()
                .filter(book -> matchesAllTokens(book, tokens))
                .limit(MAX_SEARCH_RESULTS)  // 최대 50개 제한
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
        book.setAges(dto.getAges());
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
        dto.setAges(book.getAges());
        return dto;
    }

    private boolean matchesAllTokens(BookEntity book, List<String> tokens) {
        String title = safeLower(book.getTitle());
        String author = safeLower(book.getAuthor());
        String isbn = safeLower(book.getIsbn());
        String publisher = safeLower(book.getPublisher());
        String titleNoSpace = removeSpaces(title);
        String authorNoSpace = removeSpaces(author);
        String isbnNoSpace = removeSpaces(isbn);
        String publisherNoSpace = removeSpaces(publisher);

        for (String token : tokens) {
            if (token.isEmpty()) continue;
            String tokenNoSpace = removeSpaces(token);
            boolean matches = title.contains(token)
                    || author.contains(token)
                    || isbn.contains(token)
                    || publisher.contains(token)
                    || (!tokenNoSpace.isEmpty()
                        && (titleNoSpace.contains(tokenNoSpace)
                            || authorNoSpace.contains(tokenNoSpace)
                            || isbnNoSpace.contains(tokenNoSpace)
                            || publisherNoSpace.contains(tokenNoSpace)));
            if (!matches) {
                return false;
            }
        }
        return true;
    }

    private String safeLower(String value) {
        return value == null ? "" : value.toLowerCase();
    }

    private String removeSpaces(String value) {
        return value == null ? "" : value.replaceAll("\\s+", "");
    }

    private String normalizeIsbn(String isbn) {
        if (isbn == null) return "";
        return isbn.replaceAll("[^0-9Xx]", "");
    }

    private List<BookEntity> mergeCandidates(List<BookEntity> primary, List<BookEntity> secondary) {
        if (secondary == null || secondary.isEmpty()) {
            return primary;
        }
        java.util.LinkedHashMap<Long, BookEntity> merged = new java.util.LinkedHashMap<>();
        for (BookEntity book : primary) {
            if (book.getBookId() != null) {
                merged.put(book.getBookId(), book);
            }
        }
        for (BookEntity book : secondary) {
            if (book.getBookId() != null) {
                merged.putIfAbsent(book.getBookId(), book);
            }
        }
        return new java.util.ArrayList<>(merged.values());
    }
}
