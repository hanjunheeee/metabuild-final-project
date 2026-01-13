package com.example.ex02.Community.entity;

import com.example.ex02.Book.entity.BookEntity;
import com.example.ex02.User.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "community") 
@Getter
@Setter
@NoArgsConstructor         
// 커뮤니티 게시글 엔티티
public class CommunityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "community_id")
    private Long communityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = true)
    private BookEntity book;  // 책 선택은 선택사항

    @Lob
    @Basic(fetch = FetchType.EAGER)
    @Column(name = "content_json")
    private String contentJson;

    @Column(name = "thumbnail_url", length = 300)
    private String thumbnailUrl;

    @Column(name = "community_great")
    private Integer communityGreat = 0;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "updated_at")
    private LocalDate updatedAt;

    @Column(name = "is_notice")
    private Integer isNotice = 0;  // 0: 일반글, 1: 공지글

    @Column(name = "community_kind", length = 20)
    private String communityKind = "FREE";  // QUESTION, FREE, REVIEW

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDate.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDate.now();
    }
}
