package com.example.ex02.Community.service;

import com.example.ex02.Community.dto.CommentDTO;
import com.example.ex02.Community.entity.CommentEntity;
import com.example.ex02.Community.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;

    // 특정 커뮤니티 글의 댓글 목록 조회
    public List<CommentDTO> getCommentsByCommunityId(Long communityId) {
        List<CommentEntity> comments = commentRepository.findByCommunity_CommunityIdOrderByCreatedAtDesc(communityId);
        return comments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // 특정 사용자의 댓글 목록 조회
    public List<CommentDTO> getCommentsByUserId(Long userId) {
        List<CommentEntity> comments = commentRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);
        return comments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // 댓글 상세 조회
    public CommentDTO getCommentById(Long commentId) {
        CommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        return convertToDTO(comment);
    }

    // Entity -> DTO 변환
    private CommentDTO convertToDTO(CommentEntity comment) {
        CommentDTO dto = new CommentDTO();
        dto.setCommentId(comment.getCommentId());
        dto.setCommunityId(comment.getCommunity().getCommunityId());
        dto.setUserId(comment.getUser().getUserId());
        dto.setUserNickname(comment.getUser().getNickname());
        dto.setContent(comment.getContent());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());
        return dto;
    }
}

