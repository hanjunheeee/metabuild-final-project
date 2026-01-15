package com.example.ex02.Ai.controller;

import com.example.ex02.Ai.service.BookAiService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController // JSON 응답을 위해 RestController 사용
@RequestMapping("/api")
// 리액트 포트 허용
@CrossOrigin(origins = "http://localhost:3001", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST}, allowCredentials = "true")
public class ChatController {

    private final BookAiService aiService;

    public ChatController(BookAiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public String chatApi(@RequestBody Map<String, String> request) {
        String userPrompt = request.getOrDefault("prompt", "");
        if (userPrompt.isEmpty()) {
            return "질문을 입력해주세요.";
        }
        return aiService.askAi(userPrompt);
    }
}