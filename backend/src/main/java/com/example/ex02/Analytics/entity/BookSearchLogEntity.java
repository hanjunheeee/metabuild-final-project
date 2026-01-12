package com.example.ex02.Analytics.entity;

import com.example.ex02.Book.entity.BookEntity;
import com.example.ex02.User.entity.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "book_search_log", indexes = {
    @Index(name = "idx_search_log_action", columnList = "action_type"),
    @Index(name = "idx_search_log_created", columnList = "created_at"),
    @Index(name = "idx_search_log_keyword", columnList = "keyword")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookSearchLogEntity {

    public enum ActionType {
        SEARCH,           // 검색어 입력
        PURCHASE_VIEW,    // 구매 조회 클릭
        LIBRARY_SEARCH,   // 도서관 검색 클릭
        AI_SUMMARY        // AI 요약 클릭
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    // 검색어 (ISBN인 경우 책 제목으로 변환되어 저장됨)
    @Column(length = 300)
    private String keyword;

    // 클릭한 책 (PURCHASE_VIEW, LIBRARY_SEARCH, AI_SUMMARY일 때)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id")
    private BookEntity book;

    // 액션 타입
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", length = 20, nullable = false)
    private ActionType actionType;

    // 사용자 (비로그인 시 NULL)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    // 생성 시각
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

