package com.example.ex02.User.controller;

import com.example.ex02.User.dto.LoginRequestDTO;
import com.example.ex02.User.dto.LoginResponseDTO;
import com.example.ex02.User.dto.SignupRequestDTO;
import com.example.ex02.User.dto.UserDTO;
import com.example.ex02.User.service.EmailService;
import com.example.ex02.User.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class UserController {

    private final UserService userService;
    private final EmailService emailService;

    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequestDTO signupRequest) {
        try {
            UserDTO user = userService.signup(
                signupRequest.getEmail(),
                signupRequest.getPassword(),
                signupRequest.getNickname(),
                signupRequest.getUserPhoto()
            );
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 로그인 (JWT 토큰 발급)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest) {
        try {
            LoginResponseDTO response = userService.login(loginRequest.getEmail(), loginRequest.getPassword());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 전체 사용자 조회
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // 사용자 ID로 조회
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // 이메일 중복 확인
    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmail(@RequestParam String email) {
        boolean available = userService.isEmailAvailable(email);
        return ResponseEntity.ok(Map.of("available", available));
    }

    // 닉네임 중복 확인
    @GetMapping("/check-nickname")
    public ResponseEntity<Map<String, Boolean>> checkNickname(@RequestParam String nickname) {
        boolean available = userService.isNicknameAvailable(nickname);
        return ResponseEntity.ok(Map.of("available", available));
    }

    // 프로필 수정 (닉네임, 프로필 사진)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(
            @PathVariable Long id,
            @RequestBody Map<String, String> updateData) {
        try {
            String nickname = updateData.get("nickname");
            String userPhoto = updateData.get("userPhoto");
            UserDTO updatedUser = userService.updateProfile(id, nickname, userPhoto);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "user", updatedUser
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 비밀번호 재설정 요청 (이메일로 재설정 링크 발송)
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            
            // 이메일 존재 여부 확인
            if (!userService.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "등록되지 않은 이메일입니다."
                ));
            }
            
            // 재설정 링크 발송
            emailService.sendPasswordResetLink(email);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "비밀번호 재설정 링크가 이메일로 발송되었습니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "이메일 발송에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    // 비밀번호 재설정 토큰 검증
    @PostMapping("/verify-reset-token")
    public ResponseEntity<?> verifyResetToken(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String token = request.get("token");
        
        boolean isValid = emailService.verifyResetToken(email, token);
        
        return ResponseEntity.ok(Map.of(
            "success", isValid,
            "message", isValid ? "유효한 토큰입니다." : "유효하지 않거나 만료된 토큰입니다."
        ));
    }

    // 비밀번호 재설정 (새 비밀번호로 변경)
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String token = request.get("token");
            String newPassword = request.get("newPassword");
            
            // 토큰 검증
            if (!emailService.verifyResetToken(email, token)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "유효하지 않거나 만료된 토큰입니다."
                ));
            }
            
            // 비밀번호 변경
            userService.changePassword(email, newPassword);
            
            // 사용된 토큰 삭제
            emailService.removeResetToken(email);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "비밀번호가 성공적으로 변경되었습니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "비밀번호 변경에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}

