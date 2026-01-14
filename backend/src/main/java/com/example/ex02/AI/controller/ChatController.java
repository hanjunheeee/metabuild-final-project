package com.example.Ex02.library.controller;

import com.example.Ex02.library.service.BookAiService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController // 데이터를 주고받는 API 서버 전용 어노테이션
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000") // React 서버의 접근을 허용
public class ChatController {

    private final BookAiService aiService;

    public ChatController(BookAiService aiService) {
        this.aiService = aiService;
    }

    /**
     * AI 채팅 API
     * POST http://localhost:8080/api/chat
     */
    @PostMapping("/chat")
    public String chatApi(@RequestBody Map<String, String> request) {
        String userPrompt = request.getOrDefault("prompt", "");

        if (userPrompt.trim().isEmpty()) {
            return "질문을 입력해주세요.";
        }

        // 서비스 로직 호출 및 결과 반환
        return aiService.askAi(userPrompt);
    }
}