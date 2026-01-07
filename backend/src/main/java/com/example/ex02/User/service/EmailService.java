package com.example.ex02.User.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    // 인증코드 저장소 (이메일 -> 코드, 만료시간)
    private final Map<String, VerificationData> verificationCodes = new ConcurrentHashMap<>();

    // 비밀번호 재설정 토큰 저장소 (이메일 -> 토큰, 만료시간)
    private final Map<String, VerificationData> resetTokens = new ConcurrentHashMap<>();

    // 인증코드 유효시간 (5분)
    private static final long CODE_EXPIRATION_TIME = 5 * 60 * 1000;

    // 비밀번호 재설정 토큰 유효시간 (30분)
    private static final long RESET_TOKEN_EXPIRATION_TIME = 30 * 60 * 1000;

    // 인증코드 발송
    public void sendVerificationCode(String email) {
        // 6자리 인증코드 생성
        String code = generateVerificationCode();
        
        // 저장 (만료시간 포함)
        verificationCodes.put(email, new VerificationData(code, System.currentTimeMillis() + CODE_EXPIRATION_TIME));
        
        // 이메일 발송
        sendEmail(email, code);
    }

    // 인증코드 검증
    public boolean verifyCode(String email, String code) {
        VerificationData data = verificationCodes.get(email);
        
        if (data == null) {
            return false; // 인증코드 없음
        }
        
        // 만료 확인
        if (System.currentTimeMillis() > data.expirationTime) {
            verificationCodes.remove(email);
            return false; // 만료됨
        }
        
        // 코드 일치 확인
        if (data.code.equals(code)) {
            verificationCodes.remove(email); // 사용된 코드 삭제
            return true;
        }
        
        return false;
    }

    // 6자리 인증코드 생성
    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // 100000 ~ 999999
        return String.valueOf(code);
    }

    // 비밀번호 재설정 토큰 생성 (UUID 기반)
    private String generateResetToken() {
        return java.util.UUID.randomUUID().toString().replace("-", "");
    }

    // 비밀번호 재설정 링크 발송
    public void sendPasswordResetLink(String email) {
        String token = generateResetToken();
        
        // 저장 (만료시간 포함)
        resetTokens.put(email, new VerificationData(token, System.currentTimeMillis() + RESET_TOKEN_EXPIRATION_TIME));
        
        // 재설정 링크 생성 (프론트엔드 URL)
        String resetLink = "http://localhost:3001/reset-password?token=" + token + "&email=" + email;
        
        // 이메일 발송
        sendPasswordResetEmail(email, resetLink);
    }

    // 비밀번호 재설정 토큰 검증
    public boolean verifyResetToken(String email, String token) {
        VerificationData data = resetTokens.get(email);
        
        if (data == null) {
            return false; // 토큰 없음
        }
        
        // 만료 확인
        if (System.currentTimeMillis() > data.expirationTime) {
            resetTokens.remove(email);
            return false; // 만료됨
        }
        
        // 토큰 일치 확인
        return data.code.equals(token);
    }

    // 비밀번호 재설정 완료 후 토큰 삭제
    public void removeResetToken(String email) {
        resetTokens.remove(email);
    }

    // 이메일 발송 (인증코드)
    private void sendEmail(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("[빌릴수 e 서울] 이메일 인증 코드");
        message.setText(
            "안녕하세요, MetaBuild입니다.\n\n" +
            "회원가입을 위한 이메일 인증 코드입니다.\n\n" +
            "인증 코드: " + code + "\n\n" +
            "이 코드는 5분간 유효합니다.\n\n" +
            "본인이 요청하지 않았다면 이 메일을 무시하세요."
        );
        
        mailSender.send(message);
    }

    // 비밀번호 재설정 이메일 발송
    private void sendPasswordResetEmail(String to, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("[빌릴수 e 서울] 비밀번호 재설정");
        message.setText(
            "안녕하세요, MetaBuild입니다.\n\n" +
            "비밀번호 재설정을 요청하셨습니다.\n\n" +
            "아래 링크를 클릭하여 새 비밀번호를 설정해주세요:\n\n" +
            resetLink + "\n\n" +
            "이 링크는 30분간 유효합니다.\n\n" +
            "본인이 요청하지 않았다면 이 메일을 무시하세요."
        );
        
        mailSender.send(message);
    }

    // 인증 데이터 클래스
    private static class VerificationData {
        String code;
        long expirationTime;

        VerificationData(String code, long expirationTime) {
            this.code = code;
            this.expirationTime = expirationTime;
        }
    }
}

