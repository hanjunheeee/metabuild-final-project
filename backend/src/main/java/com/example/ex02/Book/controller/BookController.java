package com.example.ex02.Book.controller;

import com.example.ex02.Book.dto.BookDTO;
import com.example.ex02.Book.service.BookPriceService;
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

    // 전체 도서 조회
    @GetMapping
    public ResponseEntity<List<BookDTO>> getAllBooks() {
        return ResponseEntity.ok(bookService.getAllBooks());
    }

    // 도서 ID로 조회
    @GetMapping("/{id}")
    public ResponseEntity<BookDTO> getBookById(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getBookById(id));
    }

    // 도서 구매 정보 조회 (여러 서점)
    @GetMapping("/{id}/shops")
    public ResponseEntity<?> getBookShops(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title
    ) {
        return ResponseEntity.ok(bookPriceService.getPrices(id, title));
    }
}
