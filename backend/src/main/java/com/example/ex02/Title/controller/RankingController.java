package com.example.ex02.Title.controller;

import com.example.ex02.Title.dto.RankingUserDTO;
import com.example.ex02.Title.service.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ranking")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class RankingController {

    private final RankingService rankingService;

    /**
     * 댓글 좋아요 TOP N 조회
     * GET /api/ranking/likes?limit=10
     */
    @GetMapping("/likes")
    public ResponseEntity<List<RankingUserDTO>> getTopByLikes(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<RankingUserDTO> rankings = rankingService.getTopUsersByCommentLikes(limit);
        return ResponseEntity.ok(rankings);
    }

    /**
     * 팔로워 TOP N 조회
     * GET /api/ranking/followers?limit=10
     */
    @GetMapping("/followers")
    public ResponseEntity<List<RankingUserDTO>> getTopByFollowers(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<RankingUserDTO> rankings = rankingService.getTopUsersByFollowers(limit);
        return ResponseEntity.ok(rankings);
    }

    /**
     * 명예의 전당 (좋아요 + 팔로워 TOP 10 함께 조회)
     * GET /api/ranking/hall-of-fame?limit=10
     */
    @GetMapping("/hall-of-fame")
    public ResponseEntity<Map<String, Object>> getHallOfFame(
            @RequestParam(defaultValue = "10") int limit
    ) {
        Map<String, Object> result = new HashMap<>();
        result.put("topByLikes", rankingService.getTopUsersByCommentLikes(limit));
        result.put("topByFollowers", rankingService.getTopUsersByFollowers(limit));
        return ResponseEntity.ok(result);
    }
}

