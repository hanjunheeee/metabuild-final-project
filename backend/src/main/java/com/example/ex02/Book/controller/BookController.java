package com.example.ex02.Book.controller;

import com.example.ex02.Book.dto.BookDTO;
import com.example.ex02.Book.dto.BookSummaryResponse;
import com.example.ex02.Book.service.BookPriceService;
import com.example.ex02.Book.service.BookSummaryService;
import com.example.ex02.Book.service.BookService;
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

    // Get all books
    @GetMapping
    public ResponseEntity<List<BookDTO>> getAllBooks() {
        return ResponseEntity.ok(bookService.getAllBooks());
    }

    // Get a book by id
    @GetMapping("/{id}")
    public ResponseEntity<BookDTO> getBookById(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getBookById(id));
    }

    // Get AI summary for a book
    @GetMapping("/{id}/summary")
    public ResponseEntity<BookSummaryResponse> getBookSummary(@PathVariable Long id) {
        return ResponseEntity.ok(bookSummaryService.getSummary(id));
    }

    // Get shop prices
    @GetMapping("/{id}/shops")
    public ResponseEntity<?> getBookShops(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title
    ) {
        return ResponseEntity.ok(bookPriceService.getPrices(id, title));
    }
}
