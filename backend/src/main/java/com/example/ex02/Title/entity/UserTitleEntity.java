package com.example.ex02.Title.entity;

import com.example.ex02.User.entity.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_title", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "title_type", "title_level"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTitleEntity {

    public enum TitleType {
        LIKE,       // 댓글 좋아요 기반
        FOLLOWER    // 팔로워 기반
    }

    public enum TitleLevel {
        BRONZE(1),   // 🥉
        SILVER(2),   // 🥈
        GOLD(3);     // 🥇

        private final int level;

        TitleLevel(int level) {
            this.level = level;
        }

        public int getLevel() {
            return level;
        }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "title_id")
    private Long titleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(name = "title_type", nullable = false, length = 20)
    private TitleType titleType;

    @Enumerated(EnumType.STRING)
    @Column(name = "title_level", nullable = false, length = 10)
    private TitleLevel titleLevel;

    @Column(name = "title_name", nullable = false, length = 50)
    private String titleName;

    @Column(name = "title_icon", length = 10)
    private String titleIcon;

    @Column(name = "achieved_at")
    private LocalDateTime achievedAt;

    @PrePersist
    protected void onCreate() {
        this.achievedAt = LocalDateTime.now();
    }
}

