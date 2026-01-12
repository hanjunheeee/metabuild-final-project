package com.example.ex02.Community.service;

import com.example.ex02.Book.entity.BookEntity;
import com.example.ex02.Book.repository.BookRepository;
import com.example.ex02.Community.dto.CommentDTO;
import com.example.ex02.Community.entity.CommentEntity;
import com.example.ex02.Community.entity.CommunityEntity;
import com.example.ex02.Community.repository.CommentRepository;
import com.example.ex02.Community.repository.CommunityRepository;
import com.example.ex02.User.entity.UserEntity;
import com.example.ex02.User.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommunityRepository communityRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    // 특정 커뮤니티 글의 댓글 목록 조회
    public List<CommentDTO> getCommentsByCommunityId(Long communityId) {
        List<CommentEntity> comments = commentRepository.findByCommunity_CommunityIdOrderByCreatedAtDesc(communityId);
        return comments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    // 특정 커뮤니티 글의 댓글 목록 페이징 조회 (부모 댓글 기준 페이징, 답글 포함)
    public Map<String, Object> getCommentsByCommunityIdPaged(Long communityId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        // 부모 댓글만 페이징 조회
        Page<CommentEntity> parentPage = commentRepository
                .findByCommunity_CommunityIdAndParentIsNullOrderByCreatedAtDesc(communityId, pageable);
        
        List<CommentEntity> parentComments = parentPage.getContent();
        
        // 부모 댓글들의 ID 목록
        List<Long> parentIds = parentComments.stream()
                .map(CommentEntity::getCommentId)
                .collect(Collectors.toList());
        
        // 해당 부모 댓글들의 답글 조회
        List<CommentEntity> replies = parentIds.isEmpty() 
                ? new ArrayList<>() 
                : commentRepository.findByParent_CommentIdIn(parentIds);
        
        // 부모 댓글 DTO 변환
        List<CommentDTO> parentDTOs = parentComments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        // 답글 DTO 변환
        List<CommentDTO> replyDTOs = replies.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        // 모든 댓글 합치기 (부모 + 답글)
        List<CommentDTO> allComments = new ArrayList<>();
        allComments.addAll(parentDTOs);
        allComments.addAll(replyDTOs);
        
        // 전체 댓글 수 (부모 + 답글)
        int totalComments = commentRepository.countByCommunity_CommunityId(communityId);
        
        return Map.of(
                "comments", allComments,
                "currentPage", page + 1,  // 1부터 시작하는 페이지 번호로 반환
                "totalPages", parentPage.getTotalPages(),
                "totalParentComments", parentPage.getTotalElements(),  // 부모 댓글 수
                "totalComments", totalComments  // 전체 댓글 수 (부모 + 답글)
        );
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

    // 댓글 작성 (일반 댓글, 책 태그 선택)
    @Transactional
    public CommentDTO createComment(Long communityId, Long userId, String content, Long bookId) {
        CommunityEntity community = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        CommentEntity comment = new CommentEntity();
        comment.setCommunity(community);
        comment.setUser(user);
        comment.setContent(content);
        comment.setParent(null);  // 일반 댓글은 parent 없음
        
        // 책 태그가 있으면 설정
        if (bookId != null) {
            BookEntity book = bookRepository.findById(bookId)
                    .orElseThrow(() -> new RuntimeException("책을 찾을 수 없습니다."));
            comment.setBook(book);
        }
        
        CommentEntity saved = commentRepository.save(comment);
        return convertToDTO(saved);
    }

    // 답글 작성 (누구나 가능, 여러 개 가능, 깊이는 1단계만, 책 태그 선택)
    @Transactional
    public CommentDTO createReply(Long communityId, Long userId, Long parentId, String content, Long bookId) {
        CommunityEntity community = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        CommentEntity parentComment = commentRepository.findById(parentId)
                .orElseThrow(() -> new RuntimeException("부모 댓글을 찾을 수 없습니다."));
        
        // 답글에 대한 답글 방지 (깊이 1단계만 허용)
        if (parentComment.getParent() != null) {
            throw new RuntimeException("답글에는 답글을 달 수 없습니다.");
        }
        
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        CommentEntity reply = new CommentEntity();
        reply.setCommunity(community);
        reply.setUser(user);
        reply.setContent(content);
        reply.setParent(parentComment);
        
        // 책 태그가 있으면 설정
        if (bookId != null) {
            BookEntity book = bookRepository.findById(bookId)
                    .orElseThrow(() -> new RuntimeException("책을 찾을 수 없습니다."));
            reply.setBook(book);
        }
        
        CommentEntity saved = commentRepository.save(reply);
        return convertToDTO(saved);
    }

    // 댓글 수정 (작성자 본인만 가능, 책 태그 수정 가능)
    @Transactional
    public CommentDTO updateComment(Long commentId, Long userId, String content, Long bookId) {
        CommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        
        // 작성자 본인인지 확인
        if (!comment.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("본인이 작성한 댓글만 수정할 수 있습니다.");
        }
        
        comment.setContent(content);
        
        // 책 태그 수정 (null이면 제거, 값이 있으면 변경)
        if (bookId != null) {
            BookEntity book = bookRepository.findById(bookId)
                    .orElseThrow(() -> new RuntimeException("책을 찾을 수 없습니다."));
            comment.setBook(book);
        } else {
            comment.setBook(null);
        }
        
        CommentEntity updated = commentRepository.save(comment);
        return convertToDTO(updated);
    }

    // 댓글 삭제 (작성자 본인만 가능)
    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        CommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        
        // 작성자 본인인지 확인
        if (!comment.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("본인이 작성한 댓글만 삭제할 수 있습니다.");
        }
        
        // 부모 댓글인 경우, 답글도 함께 삭제
        if (comment.getParent() == null) {
            // 이 댓글의 답글들 삭제
            commentRepository.deleteByParent_CommentId(commentId);
        }
        
        commentRepository.delete(comment);
    }

    // Entity -> DTO 변환
    private CommentDTO convertToDTO(CommentEntity comment) {
        CommentDTO dto = new CommentDTO();
        dto.setCommentId(comment.getCommentId());
        dto.setCommunityId(comment.getCommunity().getCommunityId());
        dto.setUserId(comment.getUser().getUserId());
        dto.setUserNickname(comment.getUser().getNickname());
        dto.setUserProfileImage(comment.getUser().getUserPhoto());
        dto.setRole(comment.getUser().getRole());  // 사용자 역할 추가
        dto.setContent(comment.getContent());
        dto.setParentId(comment.getParent() != null ? comment.getParent().getCommentId() : null);
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());
        
        // 책 정보 매핑
        if (comment.getBook() != null) {
            BookEntity book = comment.getBook();
            dto.setBookId(book.getBookId());
            dto.setBookTitle(book.getTitle());
            dto.setBookAuthor(book.getAuthor());
            dto.setBookImageUrl(book.getImageUrl());
        }
        
        return dto;
    }
}

