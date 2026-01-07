package com.example.ex02.Follow.service;

import com.example.ex02.Community.repository.CommunityRepository;
import com.example.ex02.Follow.dto.FollowDTO;
import com.example.ex02.Follow.entity.FollowEntity;
import com.example.ex02.Follow.repository.FollowRepository;
import com.example.ex02.User.entity.UserEntity;
import com.example.ex02.User.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;

    /**
     * 팔로우 토글 (팔로우/언팔로우)
     */
    @Transactional
    public boolean toggleFollow(Long followerId, Long followingId) {
        // 자기 자신 팔로우 방지
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("자기 자신을 팔로우할 수 없습니다.");
        }

        // 기존 팔로우 관계 확인
        var existingFollow = followRepository.findByFollower_UserIdAndFollowing_UserId(followerId, followingId);

        if (existingFollow.isPresent()) {
            // 언팔로우
            followRepository.delete(existingFollow.get());
            return false;
        } else {
            // 팔로우
            UserEntity follower = userRepository.findById(followerId)
                    .orElseThrow(() -> new IllegalArgumentException("팔로워를 찾을 수 없습니다."));
            UserEntity following = userRepository.findById(followingId)
                    .orElseThrow(() -> new IllegalArgumentException("팔로잉 대상을 찾을 수 없습니다."));

            FollowEntity follow = new FollowEntity();
            follow.setFollower(follower);
            follow.setFollowing(following);
            followRepository.save(follow);
            return true;
        }
    }

    /**
     * 팔로우 여부 확인
     */
    public boolean isFollowing(Long followerId, Long followingId) {
        return followRepository.existsByFollower_UserIdAndFollowing_UserId(followerId, followingId);
    }

    /**
     * 내가 팔로잉하는 사람들 목록
     */
    @Transactional(readOnly = true)
    public List<FollowDTO> getFollowingList(Long userId, Long currentUserId) {
        List<FollowEntity> followings = followRepository.findFollowingByUserId(userId);
        
        return followings.stream()
                .map(f -> convertToDTO(f.getFollowing(), currentUserId, f.getCreatedAt()))
                .collect(Collectors.toList());
    }

    /**
     * 나를 팔로우하는 사람들 목록 (팔로워)
     */
    @Transactional(readOnly = true)
    public List<FollowDTO> getFollowersList(Long userId, Long currentUserId) {
        List<FollowEntity> followers = followRepository.findFollowersByUserId(userId);
        
        return followers.stream()
                .map(f -> convertToDTO(f.getFollower(), currentUserId, f.getCreatedAt()))
                .collect(Collectors.toList());
    }

    /**
     * 팔로잉 수
     */
    public int getFollowingCount(Long userId) {
        return followRepository.countByFollower_UserId(userId);
    }

    /**
     * 팔로워 수
     */
    public int getFollowerCount(Long userId) {
        return followRepository.countByFollowing_UserId(userId);
    }

    /**
     * UserEntity를 FollowDTO로 변환
     */
    private FollowDTO convertToDTO(UserEntity user, Long currentUserId, java.time.LocalDateTime followedAt) {
        // 게시글 수 조회
        int postCount = communityRepository.countByUser_UserId(user.getUserId());
        
        // 팔로워 수 조회
        int followerCount = followRepository.countByFollowing_UserId(user.getUserId());
        
        // 현재 사용자가 이 사람을 팔로우 중인지
        boolean isFollowing = currentUserId != null && 
                followRepository.existsByFollower_UserIdAndFollowing_UserId(currentUserId, user.getUserId());

        return FollowDTO.builder()
                .userId(user.getUserId())
                .nickname(user.getNickname())
                .userPhoto(user.getUserPhoto())
                .email(user.getEmail())
                .postCount(postCount)
                .followerCount(followerCount)
                .isFollowing(isFollowing)
                .createdAt(followedAt)
                .build();
    }
}

