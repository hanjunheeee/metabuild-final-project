package com.example.ex02.Library.controller;

import com.example.ex02.Library.service.BookAiService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller // 화면 전송을 위해 @Controller 사용
@CrossOrigin(origins = "*")
public class ChatController {

    private final BookAiService aiService;

    public ChatController(BookAiService aiService) {
        this.aiService = aiService;
    }

    /**
     * 1. 채팅 페이지 접속 (HTML 반환)
     * 브라우저에서 http://localhost:8080/chat 접속 시 호출
     */
    @GetMapping("/chat")
    public String chatPage() {
        return "chat"; // src/main/resources/templates/chat.html 파일을 반환
    }

    /**
     * 2. AI 채팅 API (JSON 데이터 반환)
     * HTML 내 JavaScript에서 호출하는 통로
     */
    @PostMapping("/api/chat")
    @ResponseBody // HTML 파일명이 아닌 '문자열 데이터'를 응답값으로 보냄
    public String chatApi(@RequestBody Map<String, String> request) {
        String userPrompt = request.getOrDefault("prompt", "");
        if (userPrompt.isEmpty()) {
            return "질문을 입력해주세요.";
        }
        // 기존 서비스의 로직을 그대로 호출
        return aiService.askAi(userPrompt);
    }
}