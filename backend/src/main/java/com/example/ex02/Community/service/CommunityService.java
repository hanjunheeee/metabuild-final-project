package com.example.ex02.Community.service;

import com.example.ex02.Book.entity.BookEntity;
import com.example.ex02.Book.repository.BookRepository;
import com.example.ex02.Community.dto.CommunityCreateDTO;
import com.example.ex02.Community.dto.CommunityDTO;
import com.example.ex02.Community.entity.CommunityEntity;
import com.example.ex02.Community.repository.CommentRepository;
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

        communityRepository.delete(entity);
    }

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

