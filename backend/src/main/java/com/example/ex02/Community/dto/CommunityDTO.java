package com.example.ex02.Community.dto;

import com.example.ex02.Community.entity.CommunityEntity;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
// 커뮤니티 게시글 DTO
public class CommunityDTO {

    private Long communityId;
    private Long userId;
    private Long bookId;
    private String contentJson;
    private String thumbnailUrl;
    private Integer communityGreat;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    private Integer isNotice;  // 0: 일반글, 1: 공지글
    private String communityKind;  // QUESTION, FREE, REVIEW

    // 추가 정보 (목록 표시용)
    private String authorNickname;
    private String authorPhoto;
    private String authorRole;  // ADMIN / USER
    private String bookTitle;
    private String bookAuthor;
    private String bookCoverUrl;
    private LocalDate bookPublishedDate;
    private int commentCount;

    @Builder
    public CommunityDTO(Long communityId, Long userId, Long bookId, String contentJson, 
                        String thumbnailUrl, Integer communityGreat, LocalDate createdAt, 
                        LocalDate updatedAt, Integer isNotice, String communityKind,
                        String authorNickname, String authorPhoto, String authorRole,
                        String bookTitle, String bookAuthor, String bookCoverUrl, 
                        LocalDate bookPublishedDate, int commentCount) {
        this.communityId = communityId;
        this.userId = userId;
        this.bookId = bookId;
        this.contentJson = contentJson;
        this.thumbnailUrl = thumbnailUrl;
        this.communityGreat = communityGreat;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.isNotice = isNotice;
        this.communityKind = communityKind;
        this.authorNickname = authorNickname;
        this.authorPhoto = authorPhoto;
        this.authorRole = authorRole;
        this.bookTitle = bookTitle;
        this.bookAuthor = bookAuthor;
        this.bookCoverUrl = bookCoverUrl;
        this.bookPublishedDate = bookPublishedDate;
        this.commentCount = commentCount;
    }

    public static CommunityDTO fromEntity(CommunityEntity entity, int commentCount) {
        return CommunityDTO.builder()
                .communityId(entity.getCommunityId())
                .userId(entity.getUser().getUserId())
                .bookId(entity.getBook() != null ? entity.getBook().getBookId() : null)
                .contentJson(entity.getContentJson())
                .thumbnailUrl(entity.getThumbnailUrl())
                .communityGreat(entity.getCommunityGreat())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .isNotice(entity.getIsNotice())
                .communityKind(entity.getCommunityKind())
                .authorNickname(entity.getUser().getNickname())
                .authorPhoto(entity.getUser().getUserPhoto())
                .authorRole(entity.getUser().getRole())
                .bookTitle(entity.getBook() != null ? entity.getBook().getTitle() : null)
                .bookAuthor(entity.getBook() != null ? entity.getBook().getAuthor() : null)
                .bookCoverUrl(entity.getBook() != null ? entity.getBook().getImageUrl() : null)
                .bookPublishedDate(entity.getBook() != null ? entity.getBook().getPublishedDate() : null)
                .commentCount(commentCount)
                .build();
    }
}
