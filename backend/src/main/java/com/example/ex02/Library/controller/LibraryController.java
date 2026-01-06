package com.example.ex02.Library.controller;

import com.example.ex02.Library.service.LibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/library")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class LibraryController {

    private final LibraryService libraryService;

    // 구 리스트 반환
    @GetMapping("/gu-list")
    public ResponseEntity<List<String>> getGuList() {
        return ResponseEntity.ok(libraryService.getGuList());
    }

    // 도서관 전체 데이터 반환
    @GetMapping("/data")
    public ResponseEntity<List<Map<String, String>>> getLibraryData() {
        return ResponseEntity.ok(libraryService.getLibraryData());
    }

    // 책 검색 (외부 API 프록시)
    @GetMapping("/search-book")
    public ResponseEntity<String> searchBook(@RequestParam String query) {
        return ResponseEntity.ok(libraryService.searchBooks(query));
    }

    // 대출 가능 여부 확인 (외부 API 프록시)
    @GetMapping("/check-loan")
    public ResponseEntity<String> checkLoan(
            @RequestParam("libCode") String libCode,
            @RequestParam("isbn") String isbn) {
        return ResponseEntity.ok(libraryService.checkLoan(libCode, isbn));
    }
}
