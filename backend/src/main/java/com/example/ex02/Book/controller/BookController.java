package com.example.ex02.Book.controller;

import com.example.ex02.Book.dto.BookDTO;
import com.example.ex02.Book.dto.BestsellerItemDTO;
import com.example.ex02.Book.dto.BookSummaryResponse;
import com.example.ex02.Book.service.BookPriceService;
import com.example.ex02.Book.service.AladinBestsellerService;
import com.example.ex02.Book.service.StoreBestsellerScrapeService;
import com.example.ex02.Book.service.BookSummaryService;
import com.example.ex02.Book.service.BookService;
import com.example.ex02.Book.service.Data4LibraryLoanRankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class BookController {

    private final BookService bookService;
    private final BookPriceService bookPriceService;
    private final BookSummaryService bookSummaryService;
    private final AladinBestsellerService aladinBestsellerService;
    private final StoreBestsellerScrapeService storeBestsellerScrapeService;
    private final Data4LibraryLoanRankingService data4LibraryLoanRankingService;

    // 도서 목록 조회(검색어 포함)
    @GetMapping
    public ResponseEntity<List<BookDTO>> getAllBooks(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(bookService.searchBooks(query));
    }

    // 도서 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<BookDTO> getBookById(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getBookById(id));
    }

    // AI 요약 조회
    @GetMapping("/{id}/summary")
    public ResponseEntity<BookSummaryResponse> getBookSummary(@PathVariable Long id) {
        return ResponseEntity.ok(bookSummaryService.getSummary(id));
    }

    // 온라인 서점 가격 조회
    @GetMapping("/{id}/shops")
    public ResponseEntity<?> getBookShops(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title
    ) {
        return ResponseEntity.ok(bookPriceService.getPrices(id, title));
    }

    // 알라딘 베스트셀러 TOP10
    @GetMapping("/bestsellers/aladin")
    public ResponseEntity<?> getAladinBestsellers() {
        List<BestsellerItemDTO> items = aladinBestsellerService.fetchTop10();
        bookService.ensureBooksByIsbn(items);
        return ResponseEntity.ok(items);
    }

    // 교보 베스트셀러 TOP10(스크래핑)
    @GetMapping("/bestsellers/kyobo")
    public ResponseEntity<?> getKyoboBestsellers() {
        List<BestsellerItemDTO> items = storeBestsellerScrapeService.fetchKyoboTop10();
        bookService.ensureBooksByIsbn(items);
        return ResponseEntity.ok(items);
    }

    // YES24 베스트셀러 TOP10(스크래핑)
    @GetMapping("/bestsellers/yes24")
    public ResponseEntity<?> getYes24Bestsellers() {
        List<BestsellerItemDTO> items = storeBestsellerScrapeService.fetchYes24Top10();
        bookService.ensureBooksByIsbn(items);
        return ResponseEntity.ok(items);
    }

    // 서울 도서관 대출 TOP10
    @GetMapping("/loans/seoul")
    public ResponseEntity<List<BestsellerItemDTO>> getSeoulLoanTop10() {
        List<BestsellerItemDTO> items = data4LibraryLoanRankingService.fetchSeoulMonthlyTop10();
        bookService.ensureBooksByIsbn(items);
        return ResponseEntity.ok(items);
    }
    
    // ========================================
    // Admin CRUD APIs
    // ========================================

    // Create a new book
    @PostMapping
    public ResponseEntity<BookDTO> createBook(@RequestBody BookDTO bookDTO) {
        return ResponseEntity.ok(bookService.createBook(bookDTO));
    }

    // Update a book
    @PutMapping("/{id}")
    public ResponseEntity<BookDTO> updateBook(@PathVariable Long id, @RequestBody BookDTO bookDTO) {
        return ResponseEntity.ok(bookService.updateBook(id, bookDTO));
    }

    // Delete a book
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.noContent().build();
    }
}
