package com.example.ex02.Title.controller;

import com.example.ex02.Title.dto.UserTitleDTO;
import com.example.ex02.Title.service.UserTitleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/titles")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class UserTitleController {

    private final UserTitleService userTitleService;

    /**
     * 특정 사용자의 모든 칭호 조회
     * GET /api/titles/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserTitleDTO>> getUserTitles(@PathVariable Long userId) {
        List<UserTitleDTO> titles = userTitleService.getUserTitles(userId);
        return ResponseEntity.ok(titles);
    }

    /**
     * 특정 사용자의 최고 레벨 칭호들만 조회 (타입별 1개씩)
     * GET /api/titles/user/{userId}/top
     */
    @GetMapping("/user/{userId}/top")
    public ResponseEntity<List<UserTitleDTO>> getUserTopTitles(@PathVariable Long userId) {
        List<UserTitleDTO> titles = userTitleService.getUserTopTitles(userId);
        return ResponseEntity.ok(titles);
    }

    /**
     * 칭호 확인 및 부여 (수동 호출 or 주기적 확인)
     * POST /api/titles/check/{userId}
     */
    @PostMapping("/check/{userId}")
    public ResponseEntity<Map<String, Object>> checkAndAwardTitles(@PathVariable Long userId) {
        try {
            List<UserTitleDTO> newTitles = userTitleService.checkAndAwardAllTitles(userId);
            
            if (newTitles.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "새로 달성한 칭호가 없습니다.",
                        "newTitles", newTitles
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", newTitles.size() + "개의 새로운 칭호를 달성했습니다!",
                        "newTitles", newTitles
                ));
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 댓글 좋아요 기반 칭호만 확인
     * POST /api/titles/check/{userId}/like
     */
    @PostMapping("/check/{userId}/like")
    public ResponseEntity<Map<String, Object>> checkLikeTitles(@PathVariable Long userId) {
        try {
            List<UserTitleDTO> newTitles = userTitleService.checkAndAwardLikeTitles(userId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "newTitles", newTitles
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 팔로워 기반 칭호만 확인
     * POST /api/titles/check/{userId}/follower
     */
    @PostMapping("/check/{userId}/follower")
    public ResponseEntity<Map<String, Object>> checkFollowerTitles(@PathVariable Long userId) {
        try {
            List<UserTitleDTO> newTitles = userTitleService.checkAndAwardFollowerTitles(userId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "newTitles", newTitles
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 칭호 없는 모든 회원에게 "신간회원" 칭호 부여 (관리자용 마이그레이션)
     * POST /api/titles/migrate/welcome
     */
    @PostMapping("/migrate/welcome")
    public ResponseEntity<Map<String, Object>> migrateWelcomeTitles() {
        try {
            int awardedCount = userTitleService.awardWelcomeTitleToAllUsersWithoutTitle();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", awardedCount + "명에게 신간회원 칭호를 부여했습니다.",
                    "awardedCount", awardedCount
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}

