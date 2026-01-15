package com.example.ex02.Title.service;

import com.example.ex02.Community.repository.CommentRepository;
import com.example.ex02.Follow.repository.FollowRepository;
import com.example.ex02.Title.dto.UserTitleDTO;
import com.example.ex02.Title.entity.UserTitleEntity;
import com.example.ex02.Title.entity.UserTitleEntity.TitleLevel;
import com.example.ex02.Title.entity.UserTitleEntity.TitleType;
import com.example.ex02.Title.repository.UserTitleRepository;
import com.example.ex02.User.entity.UserEntity;
import com.example.ex02.User.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserTitleService {

    private final UserTitleRepository userTitleRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final FollowRepository followRepository;

    // ========================================
    // 칭호 정의
    // ========================================
    
    // 신규 회원 기본 칭호
    private static final String WELCOME_TITLE_NAME = "신간회원";
    private static final String WELCOME_TITLE_ICON = "🌱";
    
    // 댓글 좋아요 기반 칭호
    private static final int LIKE_BRONZE_THRESHOLD = 100;
    private static final int LIKE_SILVER_THRESHOLD = 1000;
    private static final int LIKE_GOLD_THRESHOLD = 2000;

    // 팔로워 기반 칭호
    private static final int FOLLOWER_BRONZE_THRESHOLD = 10;
    private static final int FOLLOWER_SILVER_THRESHOLD = 100;
    private static final int FOLLOWER_GOLD_THRESHOLD = 500;

    // ========================================
    // 칭호 조회
    // ========================================

    /**
     * 특정 사용자의 모든 칭호 조회
     */
    public List<UserTitleDTO> getUserTitles(Long userId) {
        List<UserTitleEntity> titles = userTitleRepository.findByUser_UserIdOrderByAchievedAtDesc(userId);
        return titles.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 특정 사용자의 최고 레벨 칭호들만 조회 (타입별 1개씩)
     */
    public List<UserTitleDTO> getUserTopTitles(Long userId) {
        List<UserTitleEntity> titles = userTitleRepository.findTopTitlesByUser(userId);
        return titles.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ========================================
    // 칭호 확인 및 부여
    // ========================================

    /**
     * 신규 회원 기본 칭호 부여 (회원가입 시 호출)
     */
    @Transactional
    public UserTitleDTO awardWelcomeTitle(Long userId) {
        // 이미 WELCOME 칭호가 있으면 부여하지 않음
        if (userTitleRepository.existsByUser_UserIdAndTitleTypeAndTitleLevel(
                userId, TitleType.WELCOME, TitleLevel.NEWBIE)) {
            log.info("이미 신간회원 칭호 보유: userId={}", userId);
            return null;
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        UserTitleEntity title = UserTitleEntity.builder()
                .user(user)
                .titleType(TitleType.WELCOME)
                .titleLevel(TitleLevel.NEWBIE)
                .titleName(WELCOME_TITLE_NAME)
                .titleIcon(WELCOME_TITLE_ICON)
                .build();

        UserTitleEntity saved = userTitleRepository.save(title);
        log.info("신간회원 칭호 부여: userId={}", userId);

        return convertToDTO(saved);
    }

    /**
     * 칭호가 없는 모든 사용자에게 신간회원 칭호 부여 (마이그레이션용)
     */
    @Transactional
    public int awardWelcomeTitleToAllUsersWithoutTitle() {
        List<UserEntity> allUsers = userRepository.findAll();
        int awardedCount = 0;

        for (UserEntity user : allUsers) {
            // 해당 사용자의 칭호가 하나도 없으면 신간회원 부여
            List<UserTitleEntity> existingTitles = userTitleRepository.findByUser_UserIdOrderByAchievedAtDesc(user.getUserId());
            if (existingTitles.isEmpty()) {
                UserTitleDTO awarded = awardWelcomeTitle(user.getUserId());
                if (awarded != null) {
                    awardedCount++;
                }
            }
        }

        log.info("총 {}명에게 신간회원 칭호 부여 완료", awardedCount);
        return awardedCount;
    }

    /**
     * 댓글 좋아요 수 기반 칭호 확인 및 부여
     */
    @Transactional
    public List<UserTitleDTO> checkAndAwardLikeTitles(Long userId) {
        Integer totalLikes = commentRepository.sumLikeCountByUserId(userId);
        int likeCount = totalLikes != null ? totalLikes : 0;
        
        List<UserTitleDTO> newTitles = new ArrayList<>();

        // GOLD 달성 확인
        if (likeCount >= LIKE_GOLD_THRESHOLD) {
            UserTitleDTO title = awardTitleIfNotExists(userId, TitleType.LIKE, TitleLevel.GOLD, 
                    "소통의 달인", "✨", "모두가 인정하는 커뮤니티의 핵심", LIKE_GOLD_THRESHOLD);
            if (title != null) newTitles.add(title);
        }
        
        // SILVER 달성 확인
        if (likeCount >= LIKE_SILVER_THRESHOLD) {
            UserTitleDTO title = awardTitleIfNotExists(userId, TitleType.LIKE, TitleLevel.SILVER, 
                    "공감 유발자", "💬", "댓글로 마음을 움직이는 사람", LIKE_SILVER_THRESHOLD);
            if (title != null) newTitles.add(title);
        }
        
        // BRONZE 달성 확인
        if (likeCount >= LIKE_BRONZE_THRESHOLD) {
            UserTitleDTO title = awardTitleIfNotExists(userId, TitleType.LIKE, TitleLevel.BRONZE, 
                    "공감의 시작", "💭", "따뜻한 말로 공감을 이끌어내는 당신", LIKE_BRONZE_THRESHOLD);
            if (title != null) newTitles.add(title);
        }

        return newTitles;
    }

    /**
     * 팔로워 수 기반 칭호 확인 및 부여
     */
    @Transactional
    public List<UserTitleDTO> checkAndAwardFollowerTitles(Long userId) {
        int followerCount = followRepository.countByFollowing_UserId(userId);
        
        List<UserTitleDTO> newTitles = new ArrayList<>();

        // GOLD 달성 확인
        if (followerCount >= FOLLOWER_GOLD_THRESHOLD) {
            UserTitleDTO title = awardTitleIfNotExists(userId, TitleType.FOLLOWER, TitleLevel.GOLD, 
                    "독서 인플루언서", "🌟", "독서 문화를 이끄는 영향력 있는 리더", FOLLOWER_GOLD_THRESHOLD);
            if (title != null) newTitles.add(title);
        }
        
        // SILVER 달성 확인
        if (followerCount >= FOLLOWER_SILVER_THRESHOLD) {
            UserTitleDTO title = awardTitleIfNotExists(userId, TitleType.FOLLOWER, TitleLevel.SILVER, 
                    "도서 큐레이터", "📖", "많은 이들이 신뢰하는 책 안내자", FOLLOWER_SILVER_THRESHOLD);
            if (title != null) newTitles.add(title);
        }
        
        // BRONZE 달성 확인
        if (followerCount >= FOLLOWER_BRONZE_THRESHOLD) {
            UserTitleDTO title = awardTitleIfNotExists(userId, TitleType.FOLLOWER, TitleLevel.BRONZE, 
                    "책방 이웃", "📚", "함께 읽는 즐거움을 아는 독서 친구", FOLLOWER_BRONZE_THRESHOLD);
            if (title != null) newTitles.add(title);
        }

        return newTitles;
    }

    /**
     * 모든 칭호 확인 및 부여 (좋아요 + 팔로워)
     */
    @Transactional
    public List<UserTitleDTO> checkAndAwardAllTitles(Long userId) {
        List<UserTitleDTO> allNewTitles = new ArrayList<>();
        allNewTitles.addAll(checkAndAwardLikeTitles(userId));
        allNewTitles.addAll(checkAndAwardFollowerTitles(userId));
        return allNewTitles;
    }

    // ========================================
    // 내부 헬퍼 메서드
    // ========================================

    /**
     * 칭호가 없으면 부여
     */
    private UserTitleDTO awardTitleIfNotExists(Long userId, TitleType type, TitleLevel level, 
                                                String name, String icon, String description, int requiredCount) {
        // 이미 보유하고 있으면 null 반환
        if (userTitleRepository.existsByUser_UserIdAndTitleTypeAndTitleLevel(userId, type, level)) {
            return null;
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        UserTitleEntity title = UserTitleEntity.builder()
                .user(user)
                .titleType(type)
                .titleLevel(level)
                .titleName(name)
                .titleIcon(icon)
                .build();

        UserTitleEntity saved = userTitleRepository.save(title);
        log.info("새 칭호 부여: userId={}, title={}", userId, name);

        UserTitleDTO dto = convertToDTO(saved);
        dto.setDescription(description);
        dto.setRequiredCount(requiredCount);
        return dto;
    }

    /**
     * Entity -> DTO 변환
     */
    private UserTitleDTO convertToDTO(UserTitleEntity entity) {
        return UserTitleDTO.builder()
                .titleId(entity.getTitleId())
                .userId(entity.getUser().getUserId())
                .titleType(entity.getTitleType().name())
                .titleLevel(entity.getTitleLevel().name())
                .titleName(entity.getTitleName())
                .titleIcon(entity.getTitleIcon())
                .achievedAt(entity.getAchievedAt())
                .build();
    }
}

