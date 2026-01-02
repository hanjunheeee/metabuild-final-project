package com.example.ex02.Community.controller;

import com.example.ex02.Community.dto.CommentDTO;
import com.example.ex02.Community.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class CommentController {

    private final CommentService commentService;

    // 특정 커뮤니티 글의 댓글 목록 조회
    @GetMapping("/community/{communityId}")
    public ResponseEntity<List<CommentDTO>> getCommentsByCommunityId(@PathVariable Long communityId) {
        List<CommentDTO> comments = commentService.getCommentsByCommunityId(communityId);
        return ResponseEntity.ok(comments);
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
}

