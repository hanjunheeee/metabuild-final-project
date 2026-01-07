package com.example.ex02.Community.controller;

import com.example.ex02.Community.dto.CommunityCreateDTO;
import com.example.ex02.Community.dto.CommunityDTO;
import com.example.ex02.Community.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/communities")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class CommunityController {

    private final CommunityService communityService;

    // 전체 커뮤니티 글 목록 조회
    @GetMapping
    public ResponseEntity<List<CommunityDTO>> getAllCommunities() {
        List<CommunityDTO> communities = communityService.getAllCommunities();
        return ResponseEntity.ok(communities);
    }

    // 커뮤니티 글 단건 조회
    @GetMapping("/{id}")
    public ResponseEntity<CommunityDTO> getCommunityById(@PathVariable Long id) {
        CommunityDTO community = communityService.getCommunityById(id);
        return ResponseEntity.ok(community);
    }

    // 커뮤니티 글 작성
    @PostMapping
    public ResponseEntity<?> createCommunity(@RequestBody CommunityCreateDTO createDTO) {
        try {
            CommunityDTO created = communityService.createCommunity(createDTO);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "게시글이 작성되었습니다.",
                "data", created
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 커뮤니티 글 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCommunity(@PathVariable Long id, @RequestParam Long userId) {
        try {
            communityService.deleteCommunity(id, userId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "게시글이 삭제되었습니다."
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 커뮤니티 글 수정
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCommunity(@PathVariable Long id, @RequestBody CommunityCreateDTO updateDTO) {
        try {
            CommunityDTO updated = communityService.updateCommunity(id, updateDTO);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "게시글이 수정되었습니다.",
                "data", updated
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 좋아요 토글
    @PostMapping("/{id}/like")
    public ResponseEntity<?> toggleLike(@PathVariable Long id, @RequestParam Long userId) {
        try {
            var result = communityService.toggleLike(id, userId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "liked", result.liked(),
                "likeCount", result.likeCount()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // 좋아요 여부 확인
    @GetMapping("/{id}/like")
    public ResponseEntity<?> checkLike(@PathVariable Long id, @RequestParam Long userId) {
        try {
            boolean liked = communityService.isLikedByUser(id, userId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "liked", liked
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // 사용자가 좋아요한 게시글 ID 목록 조회
    @GetMapping("/liked/{userId}")
    public ResponseEntity<List<Long>> getLikedCommunityIds(@PathVariable Long userId) {
        List<Long> communityIds = communityService.getLikedCommunityIdsByUserId(userId);
        return ResponseEntity.ok(communityIds);
    }
}

