package com.example.ex02.User.service;

import com.example.ex02.User.dto.LoginResponseDTO;
import com.example.ex02.User.dto.UserDTO;
import com.example.ex02.User.entity.UserEntity;
import com.example.ex02.User.repository.UserRepository;
import com.example.ex02.config.JwtUtil;
import com.example.ex02.security.TurnstileVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final TurnstileVerificationService turnstileVerificationService;

    // 전체 사용자 조회
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // 사용자 ID로 조회
    public UserDTO getUserById(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return convertToDTO(user);
    }

    // 로그인 (JWT 토큰 발급)
    public LoginResponseDTO login(String email, String password) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("이메일 또는 비밀번호가 일치하지 않습니다."));
        
        // 비밀번호 확인 (실제로는 암호화된 비밀번호 비교 필요)
        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("이메일 또는 비밀번호가 일치하지 않습니다.");
        }
        
        // 활성화 여부 확인
        if (!"Y".equals(user.getIsActive())) {
            throw new RuntimeException("비활성화된 계정입니다.");
        }
        
        // JWT 토큰 생성
        String token = jwtUtil.generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getNickname(),
                user.getRole()
        );
        
        return new LoginResponseDTO(
                token,
                user.getUserId(),
                user.getEmail(),
                user.getNickname(),
                user.getRole(),
                user.getUserPhoto()
        );
    }

    // 이메일 중복 확인
    public boolean isEmailAvailable(String email) {
        return !userRepository.existsByEmail(email);
    }

    // 닉네임 중복 확인
    public boolean isNicknameAvailable(String nickname) {
        return !userRepository.existsByNickname(nickname);
    }

    // 회원가입
    @Transactional
    public UserDTO signup(String email, String password, String nickname, String userPhoto, String captchaToken, String remoteIp) {
        // CAPTCHA 검증 (활성화된 경우에만 강제)
        turnstileVerificationService.verifyOrThrow(captchaToken, remoteIp);

        // 이메일 중복 확인
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("이미 사용 중인 이메일입니다.");
        }

        // 닉네임 중복 확인
        if (userRepository.existsByNickname(nickname)) {
            throw new RuntimeException("이미 사용 중인 닉네임입니다.");
        }

        // 새 사용자 생성
        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setPassword(password); // 실제로는 암호화 필요
        user.setNickname(nickname);
        user.setRole("USER");
        user.setIsActive("Y");
        user.setUserPhoto(userPhoto);

        UserEntity savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    // 프로필 수정
    @Transactional
    public UserDTO updateProfile(Long userId, String nickname, String userPhoto) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 닉네임 변경 시 중복 확인
        if (nickname != null && !nickname.equals(user.getNickname())) {
            if (userRepository.existsByNickname(nickname)) {
                throw new RuntimeException("이미 사용 중인 닉네임입니다.");
            }
            user.setNickname(nickname);
        }

        // 프로필 사진 변경
        if (userPhoto != null) {
            user.setUserPhoto(userPhoto);
        }

        UserEntity savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    // 이메일로 사용자 존재 여부 확인
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    // 비밀번호 변경 (이메일 기준 - 비밀번호 찾기용)
    @Transactional
    public void changePassword(String email, String newPassword) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        user.setPassword(newPassword); // 실제로는 암호화 필요
        userRepository.save(user);
    }

    // 비밀번호 변경 (현재 비밀번호 검증 후 - 마이페이지용)
    @Transactional
    public void changePasswordWithVerification(Long userId, String currentPassword, String newPassword) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 현재 비밀번호 검증
        if (!user.getPassword().equals(currentPassword)) {
            throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
        }
        
        user.setPassword(newPassword); // 실제로는 암호화 필요
        userRepository.save(user);
    }

    // 회원 활성/비활성 상태 변경 (관리자용)
    @Transactional
    public UserDTO updateUserStatus(Long userId, String isActive) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        user.setIsActive(isActive);
        UserEntity savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    // Entity -> DTO 변환
    private UserDTO convertToDTO(UserEntity user) {
        UserDTO dto = new UserDTO();
        dto.setUserId(user.getUserId());
        dto.setEmail(user.getEmail());
        dto.setNickname(user.getNickname());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setIsActive(user.getIsActive());
        dto.setUserPhoto(user.getUserPhoto());
        return dto;
    }
}
