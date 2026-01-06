package com.example.ex02.Community.service;

import com.example.ex02.Book.entity.BookEntity;
import com.example.ex02.Book.repository.BookRepository;
import com.example.ex02.Community.dto.CommunityCreateDTO;
import com.example.ex02.Community.dto.CommunityDTO;
import com.example.ex02.Community.entity.CommunityEntity;
import com.example.ex02.Community.entity.CommunityLikeEntity;
import com.example.ex02.Community.repository.CommentRepository;
import com.example.ex02.Community.repository.CommunityLikeRepository;
import com.example.ex02.Community.repository.CommunityRepository;
import com.example.ex02.User.entity.UserEntity;
import com.example.ex02.User.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityService {

    private final CommunityRepository communityRepository;
    private final CommentRepository commentRepository;
    private final CommunityLikeRepository communityLikeRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    // 전체 커뮤니티 글 목록 조회 (최신순)
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
    public CommunityDTO getCommunityById(Long communityId) {
        CommunityEntity entity = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        int commentCount = commentRepository.countByCommunity_CommunityId(communityId);
        return CommunityDTO.fromEntity(entity, commentCount);
    }

    // 커뮤니티 글 작성
    @Transactional
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
        entity.setIsNotice(0);

        // 저장
        CommunityEntity saved = communityRepository.save(entity);

        return CommunityDTO.fromEntity(saved, 0);
    }

    // 커뮤니티 글 삭제
    @Transactional
    public void deleteCommunity(Long communityId, Long userId) {
        CommunityEntity entity = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        // 작성자 확인
        if (!entity.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("본인이 작성한 게시글만 삭제할 수 있습니다.");
        }

        // 1. 해당 게시글의 모든 좋아요 삭제
        communityLikeRepository.deleteByCommunity_CommunityId(communityId);
        
        // 2. 해당 게시글의 모든 댓글 삭제
        commentRepository.deleteByCommunity_CommunityId(communityId);
        
        // 3. 게시글 삭제
        communityRepository.delete(entity);
    }

    // 커뮤니티 글 수정
    @Transactional
    public CommunityDTO updateCommunity(Long communityId, CommunityCreateDTO updateDTO) {
        CommunityEntity entity = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        // 작성자 확인
        if (!entity.getUser().getUserId().equals(updateDTO.getUserId())) {
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
    public boolean isLikedByUser(Long communityId, Long userId) {
        return communityLikeRepository.existsByUser_UserIdAndCommunity_CommunityId(userId, communityId);
    }
    
    // 좋아요 결과 DTO
    public record LikeResult(boolean liked, int likeCount) {}

    // JSON 문자열 이스케이프
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

