package com.example.ex02.Analytics.controller;

import com.example.ex02.Analytics.dto.SearchTrendDTO;
import com.example.ex02.Analytics.entity.BookSearchLogEntity.ActionType;
import com.example.ex02.Analytics.service.SearchTrendService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class SearchTrendController {

    private final SearchTrendService searchTrendService;

    // ========================================
    // 트렌드 조회 API
    // ========================================

    /**
     * 인기 검색어 조회 (워드클라우드용)
     * GET /api/analytics/trends/keywords
     */
    @GetMapping("/trends/keywords")
    public ResponseEntity<List<SearchTrendDTO>> getKeywordTrends() {
        List<SearchTrendDTO> trends = searchTrendService.getKeywordTrends();
        return ResponseEntity.ok(trends);
    }

    /**
     * 구매 인기 도서 조회
     * GET /api/analytics/trends/purchase
     */
    @GetMapping("/trends/purchase")
    public ResponseEntity<List<SearchTrendDTO>> getPurchaseTrends() {
        List<SearchTrendDTO> trends = searchTrendService.getPurchaseTrends();
        return ResponseEntity.ok(trends);
    }

    /**
     * 대출 인기 도서 조회
     * GET /api/analytics/trends/library
     */
    @GetMapping("/trends/library")
    public ResponseEntity<List<SearchTrendDTO>> getLibraryTrends() {
        List<SearchTrendDTO> trends = searchTrendService.getLibraryTrends();
        return ResponseEntity.ok(trends);
    }

    // ========================================
    // 로그 저장 API
    // ========================================

    /**
     * 검색 로그 저장
     * POST /api/analytics/log/search
     * Body: { "keyword": "클린코드", "bookTitle": "클린 코드" }
     */
    @PostMapping("/log/search")
    public ResponseEntity<Map<String, String>> logSearch(
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        String keyword = request.get("keyword");
        String bookTitle = request.get("bookTitle");

        Long userId = null;
        if (authentication != null && authentication.getCredentials() != null) {
            userId = (Long) authentication.getCredentials();
        }

        searchTrendService.logSearch(keyword, userId, bookTitle);
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    /**
     * 책 액션 로그 저장 (구매조회, 도서관검색, AI요약)
     * POST /api/analytics/log/action
     * Body: { "bookId": 123, "actionType": "PURCHASE_VIEW" }
     */
    @PostMapping("/log/action")
    public ResponseEntity<Map<String, String>> logBookAction(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        Long bookId = null;
        Object bookIdObj = request.get("bookId");
        if (bookIdObj instanceof Number) {
            bookId = ((Number) bookIdObj).longValue();
        }

        String actionTypeStr = (String) request.get("actionType");
        ActionType actionType;
        try {
            actionType = ActionType.valueOf(actionTypeStr);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid actionType"));
        }

        Long userId = null;
        if (authentication != null && authentication.getCredentials() != null) {
            userId = (Long) authentication.getCredentials();
        }

        searchTrendService.logBookAction(bookId, userId, actionType);
        return ResponseEntity.ok(Map.of("status", "success"));
    }
}

