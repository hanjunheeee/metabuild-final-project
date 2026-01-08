package com.example.ex02.Bookmark.controller;

import com.example.ex02.Bookmark.dto.BookmarkDTO;
import com.example.ex02.Bookmark.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class BookmarkController {

    private final BookmarkService bookmarkService;

    /**
     * 북마크 토글 (추가/삭제)
     * POST /api/bookmarks/toggle
     */
    @PostMapping("/toggle")
    public ResponseEntity<Map<String, Object>> toggleBookmark(@RequestBody Map<String, Long> request) {
        Long userId = request.get("userId");
        Long bookId = request.get("bookId");
        
        if (userId == null || bookId == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "userId와 bookId가 필요합니다."
            ));
        }
        
        Map<String, Object> result = bookmarkService.toggleBookmark(userId, bookId);
        return ResponseEntity.ok(result);
    }

    /**
     * 북마크 여부 확인
     * GET /api/bookmarks/check?userId={userId}&bookId={bookId}
     */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkBookmark(
            @RequestParam Long userId,
            @RequestParam Long bookId) {
        Map<String, Object> result = bookmarkService.checkBookmark(userId, bookId);
        return ResponseEntity.ok(result);
    }

    /**
     * 사용자의 북마크 목록 조회
     * GET /api/bookmarks/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BookmarkDTO>> getBookmarksByUser(@PathVariable Long userId) {
        List<BookmarkDTO> bookmarks = bookmarkService.getBookmarksByUserId(userId);
        return ResponseEntity.ok(bookmarks);
    }

    /**
     * 사용자가 북마크한 책 ID 목록 조회
     * GET /api/bookmarks/user/{userId}/book-ids
     */
    @GetMapping("/user/{userId}/book-ids")
    public ResponseEntity<List<Long>> getBookmarkedBookIds(@PathVariable Long userId) {
        List<Long> bookIds = bookmarkService.getBookmarkedBookIds(userId);
        return ResponseEntity.ok(bookIds);
    }
}
