package com.example.ex02.Community.controller;

import com.example.ex02.Community.dto.CommentDTO;
import com.example.ex02.Community.service.CommentService;
import com.example.ex02.Title.dto.UserTitleDTO;
import com.example.ex02.Title.service.UserTitleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class CommentController {

    private final CommentService commentService;
    private final UserTitleService userTitleService;

    // 특정 커뮤니티 글의 댓글 목록 조회 (전체)
    @GetMapping("/community/{communityId}")
    public ResponseEntity<List<CommentDTO>> getCommentsByCommunityId(@PathVariable Long communityId) {
        List<CommentDTO> comments = commentService.getCommentsByCommunityId(communityId);
        return ResponseEntity.ok(comments);
    }
    
    // 특정 커뮤니티 글의 댓글 목록 페이징 조회
    @GetMapping("/community/{communityId}/paged")
    public ResponseEntity<Map<String, Object>> getCommentsByCommunityIdPaged(
            @PathVariable Long communityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        Map<String, Object> result = commentService.getCommentsByCommunityIdPaged(communityId, page, size);
        return ResponseEntity.ok(result);
    }

    // 특정 사용자의 댓글 목록 조회
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CommentDTO>> getCommentsByUserId(@PathVariable Long userId) {
        List<CommentDTO> comments = commentService.getCommentsByUserId(userId);
        return ResponseEntity.ok(comments);
    }

    // 댓글 상세 조회
    @GetMapping("/{commentId}")
    public ResponseEntity<CommentDTO> getCommentById(@PathVariable Long commentId) {
        CommentDTO comment = commentService.getCommentById(commentId);
        return ResponseEntity.ok(comment);
    }

    // 댓글 작성
    @PostMapping
    public ResponseEntity<?> createComment(@RequestBody Map<String, Object> request) {
        try {
            Long communityId = ((Number) request.get("communityId")).longValue();
            Long userId = ((Number) request.get("userId")).longValue();
            String content = (String) request.get("content");
            Long parentId = request.get("parentId") != null 
                    ? ((Number) request.get("parentId")).longValue() 
                    : null;
            Long bookId = request.get("bookId") != null 
                    ? ((Number) request.get("bookId")).longValue() 
                    : null;
            
            CommentDTO created;
            if (parentId != null) {
                // 답글 작성 (책 태그 선택 가능)
                created = commentService.createReply(communityId, userId, parentId, content, bookId);
            } else {
                // 일반 댓글 작성 (책 태그 선택)
                created = commentService.createComment(communityId, userId, content, bookId);
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", parentId != null ? "답글이 작성되었습니다." : "댓글이 작성되었습니다.",
                "data", created
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 댓글 수정 (책 태그 수정 가능)
    @PutMapping("/{commentId}")
    public ResponseEntity<?> updateComment(
            @PathVariable Long commentId,
            @RequestBody Map<String, Object> request
    ) {
        try {
            Long userId = ((Number) request.get("userId")).longValue();
            String content = (String) request.get("content");
            Long bookId = request.get("bookId") != null 
                    ? ((Number) request.get("bookId")).longValue() 
                    : null;
            
            CommentDTO updated = commentService.updateComment(commentId, userId, content, bookId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "댓글이 수정되었습니다.",
                "data", updated
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 댓글 삭제
    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long commentId,
            @RequestParam Long userId
    ) {
        try {
            commentService.deleteComment(commentId, userId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "댓글이 삭제되었습니다."
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 댓글 좋아요 토글 (좋아요/취소)
    @PostMapping("/{commentId}/like")
    public ResponseEntity<?> toggleLike(
            @PathVariable Long commentId,
            @RequestBody Map<String, Object> request
    ) {
        try {
            Long userId = ((Number) request.get("userId")).longValue();
            Map<String, Object> result = commentService.toggleLike(commentId, userId);
            boolean isLiked = (Boolean) result.get("isLiked");
            
            // 좋아요가 추가된 경우, 댓글 작성자의 칭호 확인
            List<UserTitleDTO> newTitles = List.of();
            if (isLiked) {
                Long commentAuthorId = (Long) result.get("commentAuthorId");
                newTitles = userTitleService.checkAndAwardLikeTitles(commentAuthorId);
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", isLiked ? "좋아요가 반영되었습니다." : "좋아요가 취소되었습니다.",
                "data", result,
                "newTitles", newTitles
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 특정 사용자가 좋아요한 댓글 ID 목록 조회
    @GetMapping("/user/{userId}/liked")
    public ResponseEntity<?> getLikedCommentIds(@PathVariable Long userId) {
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "likedCommentIds", commentService.getLikedCommentIds(userId)
        ));
    }

    // 특정 사용자가 받은 총 댓글 좋아요 수 조회 (칭호 시스템용)
    @GetMapping("/user/{userId}/total-likes")
    public ResponseEntity<?> getTotalLikesByUserId(@PathVariable Long userId) {
        int totalLikes = commentService.getTotalLikesByUserId(userId);
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "totalLikes", totalLikes
        ));
    }
}

