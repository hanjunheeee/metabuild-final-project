package com.example.ex02.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;

import java.util.Map;

@Service
public class TurnstileVerificationService {

    @Value("${turnstile.enabled:false}")
    private boolean enabled;

    @Value("${turnstile.secret-key:}")
    private String secretKey;

    @Value("${turnstile.verify-url:https://challenges.cloudflare.com/turnstile/v0/siteverify}")
    private String verifyUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public void verifyOrThrow(String captchaToken, String remoteIp) {
        if (!enabled) {
            return; // 개발/비활성화 모드
        }

        String secret = secretKey == null ? "" : secretKey.trim();
        if (secret.isEmpty()) {
            throw new RuntimeException("CAPTCHA 설정이 누락되었습니다. (turnstile.secret-key)");
        }

        if (captchaToken == null || captchaToken.trim().isEmpty()) {
            throw new RuntimeException("CAPTCHA 인증이 필요합니다.");
        }

        if (!verify(captchaToken.trim(), remoteIp)) {
            throw new RuntimeException("CAPTCHA 인증에 실패했습니다.");
        }
    }

    private boolean verify(String token, String remoteIp) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("secret", secretKey.trim());
        form.add("response", token);
        if (remoteIp != null && !remoteIp.isBlank()) {
            form.add("remoteip", remoteIp);
        }

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    verifyUrl,
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<>() {}
            );
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return false;
            }
            Object success = response.getBody().get("success");
            return Boolean.TRUE.equals(success);
        } catch (Exception e) {
            return false;
        }
    }
}


