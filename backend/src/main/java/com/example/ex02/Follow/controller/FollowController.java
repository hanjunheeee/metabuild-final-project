package com.example.ex02.Follow.controller;

import com.example.ex02.Follow.dto.FollowDTO;
import com.example.ex02.Follow.service.FollowService;
import com.example.ex02.Title.dto.UserTitleDTO;
import com.example.ex02.Title.service.UserTitleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/follow")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class FollowController {

    private final FollowService followService;
    private final UserTitleService userTitleService;

    /**
     * 팔로우/언팔로우 토글
     * POST /api/follow/toggle
     */
    @PostMapping("/toggle")
    public ResponseEntity<Map<String, Object>> toggleFollow(
            @RequestParam Long followerId,
            @RequestParam Long followingId
    ) {
        Map<String, Object> response = new HashMap<>();
        try {
            boolean isFollowing = followService.toggleFollow(followerId, followingId);
            response.put("success", true);
            response.put("isFollowing", isFollowing);
            response.put("message", isFollowing ? "팔로우 했습니다." : "언팔로우 했습니다.");
            
            // 팔로우가 추가된 경우, 팔로잉 대상의 칭호 확인
            if (isFollowing) {
                List<UserTitleDTO> newTitles = userTitleService.checkAndAwardFollowerTitles(followingId);
                response.put("newTitles", newTitles);
            } else {
                response.put("newTitles", List.of());
            }
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 팔로우 여부 확인
     * GET /api/follow/check?followerId=1&followingId=2
     */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkFollowing(
            @RequestParam Long followerId,
            @RequestParam Long followingId
    ) {
        Map<String, Object> response = new HashMap<>();
        boolean isFollowing = followService.isFollowing(followerId, followingId);
        response.put("isFollowing", isFollowing);
        return ResponseEntity.ok(response);
    }

    /**
     * 팔로잉 목록 조회
     * GET /api/follow/following/{userId}?currentUserId=1
     */
    @GetMapping("/following/{userId}")
    public ResponseEntity<List<FollowDTO>> getFollowingList(
            @PathVariable Long userId,
            @RequestParam(required = false) Long currentUserId
    ) {
        List<FollowDTO> list = followService.getFollowingList(userId, currentUserId);
        return ResponseEntity.ok(list);
    }

    /**
     * 팔로워 목록 조회
     * GET /api/follow/followers/{userId}?currentUserId=1
     */
    @GetMapping("/followers/{userId}")
    public ResponseEntity<List<FollowDTO>> getFollowersList(
            @PathVariable Long userId,
            @RequestParam(required = false) Long currentUserId
    ) {
        List<FollowDTO> list = followService.getFollowersList(userId, currentUserId);
        return ResponseEntity.ok(list);
    }

    /**
     * 팔로잉/팔로워 수 조회
     * GET /api/follow/count/{userId}
     */
    @GetMapping("/count/{userId}")
    public ResponseEntity<Map<String, Integer>> getFollowCounts(@PathVariable Long userId) {
        Map<String, Integer> counts = new HashMap<>();
        counts.put("followingCount", followService.getFollowingCount(userId));
        counts.put("followerCount", followService.getFollowerCount(userId));
        return ResponseEntity.ok(counts);
    }
}

