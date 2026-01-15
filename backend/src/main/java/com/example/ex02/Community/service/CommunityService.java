package com.example.ex02.Community.service;

import com.example.ex02.Book.entity.BookEntity;
import com.example.ex02.Book.repository.BookRepository;
import com.example.ex02.Community.dto.CommunityCreateDTO;
import com.example.ex02.Community.dto.CommunityDTO;
import com.example.ex02.Community.entity.CommunityEntity;
import com.example.ex02.Community.entity.CommunityLikeEntity;
import com.example.ex02.Community.repository.CommentRepository;
import com.example.ex02.Community.repository.CommentLikeRepository;
import com.example.ex02.Community.repository.CommunityLikeRepository;
import com.example.ex02.Community.repository.CommunityRepository;
import com.example.ex02.User.entity.UserEntity;
import com.example.ex02.User.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

// 커뮤니티 글/댓글/좋아요 비즈니스 로직
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityService {

    private final CommunityRepository communityRepository;
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final CommunityLikeRepository communityLikeRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    // 전체 커뮤니티 글 목록 조회 (최신순)
    // 커뮤니티 목록 조회(최신순)
    public List<CommunityDTO> getAllCommunities() {
        List<CommunityEntity> entities = communityRepository.findAll(
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        return entities.stream()
                .map(entity -> {
                    int commentCount = commentRepository.countByCommunity_CommunityId(entity.getCommunityId());
                    return CommunityDTO.fromEntity(entity, commentCount);
                })
                .collect(Collectors.toList());
    }

    // 커뮤니티 글 단건 조회
    // 커뮤니티 상세 조회
    public CommunityDTO getCommunityById(Long communityId) {
        CommunityEntity entity = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        int commentCount = commentRepository.countByCommunity_CommunityId(communityId);
        return CommunityDTO.fromEntity(entity, commentCount);
    }

    // 커뮤니티 글 작성
    @Transactional
    // 커뮤니티 글 생성
    public CommunityDTO createCommunity(CommunityCreateDTO createDTO) {
        // 사용자 조회
        UserEntity user = userRepository.findById(createDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 책 조회 (선택사항)
        BookEntity book = null;
        if (createDTO.getBookId() != null) {
            book = bookRepository.findById(createDTO.getBookId())
                    .orElse(null);
        }

        // contentJson 생성 (title + content를 JSON으로 저장)
        String contentJson = String.format(
            "{\"title\":\"%s\",\"content\":\"%s\"}",
            escapeJson(createDTO.getTitle()),
            escapeJson(createDTO.getContent())
        );

        // 엔티티 생성
        CommunityEntity entity = new CommunityEntity();
        entity.setUser(user);
        entity.setBook(book);
        entity.setContentJson(contentJson);
        entity.setCommunityKind(createDTO.getCommunityKind() != null ? createDTO.getCommunityKind() : "FREE");
        entity.setThumbnailUrl(createDTO.getThumbnailUrl());
        entity.setCommunityGreat(0);
        entity.setIsNotice(createDTO.getIsNotice() != null ? createDTO.getIsNotice() : 0);

        // 저장
        CommunityEntity saved = communityRepository.save(entity);

        return CommunityDTO.fromEntity(saved, 0);
    }

    // 커뮤니티 글 삭제 (userId가 null이면 관리자 삭제로 처리)
    @Transactional
    // 커뮤니티 글 삭제(관리자/본인)
    public void deleteCommunity(Long communityId, Long userId) {
        CommunityEntity entity = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        // 작성자 확인 (userId가 null이면 관리자 삭제 - 확인 생략)
        if (userId != null && !entity.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("본인이 작성한 게시글만 삭제할 수 있습니다.");
        }

        // 1. 해당 게시글의 모든 좋아요 삭제
        communityLikeRepository.deleteByCommunity_CommunityId(communityId);
        
        // 2. 해당 게시글의 모든 댓글 좋아요 삭제 (댓글에 연결된 좋아요)
        commentRepository.findByCommunity_CommunityIdOrderByCreatedAtDesc(communityId)
            .forEach(comment -> commentLikeRepository.deleteByComment_CommentId(comment.getCommentId()));
        
        // 3. 해당 게시글의 모든 댓글 삭제
        commentRepository.deleteByCommunity_CommunityId(communityId);
        
        // 4. 게시글 삭제
        communityRepository.delete(entity);
    }

    // 커뮤니티 글 수정
    @Transactional
    // 커뮤니티 글 수정
    public CommunityDTO updateCommunity(Long communityId, CommunityCreateDTO updateDTO) {
        CommunityEntity entity = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        // 작성자 확인 (userId가 null이면 관리자 수정 - 공지사항만 허용)
        if (updateDTO.getUserId() != null && !entity.getUser().getUserId().equals(updateDTO.getUserId())) {
            throw new RuntimeException("본인이 작성한 게시글만 수정할 수 있습니다.");
        }

        // 책 조회 (선택사항)
        BookEntity book = null;
        if (updateDTO.getBookId() != null) {
            book = bookRepository.findById(updateDTO.getBookId())
                    .orElse(null);
        }

        // contentJson 업데이트
        String contentJson = String.format(
            "{\"title\":\"%s\",\"content\":\"%s\"}",
            escapeJson(updateDTO.getTitle()),
            escapeJson(updateDTO.getContent())
        );

        // 엔티티 업데이트
        entity.setBook(book);
        entity.setContentJson(contentJson);
        entity.setCommunityKind(updateDTO.getCommunityKind() != null ? updateDTO.getCommunityKind() : entity.getCommunityKind());
        entity.setThumbnailUrl(updateDTO.getThumbnailUrl());

        CommunityEntity saved = communityRepository.save(entity);
        int commentCount = commentRepository.countByCommunity_CommunityId(communityId);

        return CommunityDTO.fromEntity(saved, commentCount);
    }

    // 좋아요 토글
    @Transactional
    // 좋아요 토글 및 카운트 갱신
    public LikeResult toggleLike(Long communityId, Long userId) {
        CommunityEntity community = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 기존 좋아요 확인
        var existingLike = communityLikeRepository.findByUser_UserIdAndCommunity_CommunityId(userId, communityId);
        
        int currentGreat = community.getCommunityGreat() != null ? community.getCommunityGreat() : 0;
        boolean liked;
        
        if (existingLike.isPresent()) {
            // 이미 좋아요 함 → 취소
            communityLikeRepository.delete(existingLike.get());
            community.setCommunityGreat(Math.max(0, currentGreat - 1));  // 0 미만 방지
            liked = false;
        } else {
            // 좋아요 안 함 → 추가
            CommunityLikeEntity like = new CommunityLikeEntity(user, community);
            communityLikeRepository.save(like);
            community.setCommunityGreat(currentGreat + 1);
            liked = true;
        }
        
        communityRepository.save(community);

        return new LikeResult(liked, community.getCommunityGreat());
    }
    
    // 좋아요 여부 확인
    // 좋아요 여부 확인
    public boolean isLikedByUser(Long communityId, Long userId) {
        return communityLikeRepository.existsByUser_UserIdAndCommunity_CommunityId(userId, communityId);
    }
    
    // 사용자가 좋아요한 게시글 ID 목록만 조회 (N+1 문제 방지)
    // 사용자가 좋아요한 게시글 ID 목록
    public List<Long> getLikedCommunityIdsByUserId(Long userId) {
        List<CommunityLikeEntity> likes = communityLikeRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);
        return likes.stream()
                .map(like -> like.getCommunity().getCommunityId())
                .collect(Collectors.toList());
    }
    
    // 주간 HOT 게시글 조회 (최근 7일 내 작성, 좋아요 순)
    // 주간 HOT 게시글 조회
    public List<CommunityDTO> getWeeklyHotPosts(int limit) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(7);
        List<CommunityEntity> entities = communityRepository.findWeeklyHotPosts(startDate);
        
        return entities.stream()
                .limit(limit)
                .map(entity -> {
                    int commentCount = commentRepository.countByCommunity_CommunityId(entity.getCommunityId());
                    return CommunityDTO.fromEntity(entity, commentCount);
                })
                .collect(Collectors.toList());
    }
    
    // 좋아요 결과 DTO
    public record LikeResult(boolean liked, int likeCount) {}

    // JSON 문자열 이스케이프
    // JSON 문자열 이스케이프 처리
    private String escapeJson(String str) {
        if (str == null) return "";
        return str
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");
    }
}
