package com.example.ex02.User.controller;

import com.example.ex02.User.dto.EmailRequestDTO;
import com.example.ex02.User.dto.EmailCodeRequestDTO;
import com.example.ex02.User.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "http://localhost:3001")
public class EmailController {

    @Autowired
    private EmailService emailService;

    // 인증코드 발송
    @PostMapping("/send-code")
    public ResponseEntity<?> sendVerificationCode(@RequestBody EmailRequestDTO request) {
        try {
            emailService.sendVerificationCode(request.getEmail());
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "인증코드가 발송되었습니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "이메일 발송에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    // 인증코드 확인
    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody EmailCodeRequestDTO request) {
        boolean isValid = emailService.verifyCode(request.getEmail(), request.getCode());
        
        if (isValid) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "이메일 인증이 완료되었습니다."
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "인증코드가 올바르지 않거나 만료되었습니다."
            ));
        }
    }
}

