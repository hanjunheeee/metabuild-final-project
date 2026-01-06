package com.example.ex02.Community.entity;

import com.example.ex02.User.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "community_like", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "community_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class CommunityLikeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "like_id")
    private Long likeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id", nullable = false)
    private CommunityEntity community;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public CommunityLikeEntity(UserEntity user, CommunityEntity community) {
        this.user = user;
        this.community = community;
    }
}

