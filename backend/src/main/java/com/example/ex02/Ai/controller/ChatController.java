package com.example.ex02.Ai.controller;

import com.example.ex02.Ai.service.BookAiService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController // JSON 응답을 위해 RestController 사용
@RequestMapping("/api")
// 리액트 요청 허용
@CrossOrigin(origins = "http://localhost:3001", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST}, allowCredentials = "true")
public class ChatController {

    private final BookAiService aiService;
    private static final String PROFANITY_WARNING =
            "비속어는 사용할 수 없습니다. 정중한 표현으로 다시 질문해 주세요.";
    private static final String[] PROFANITY_LIST = {
            "씨발", "시발", "ㅅㅂ", "ㅆㅂ", "병신", "ㅂㅅ", "좆", "ㅈ같", "개새", "새끼", "ㅅㄲ",
            "미친", "미쳤", "염병", "븅신", "꺼져", "꺼져라", "닥쳐", "좆밥", "씹",
            "fuck", "shit", "bitch", "asshole", "bastard"
    };

    public ChatController(BookAiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public String chatApi(@RequestBody Map<String, Object> request) {
        Object promptObj = request.getOrDefault("prompt", "");
        String userPrompt = promptObj == null ? "" : promptObj.toString();
        if (userPrompt.isEmpty()) {
            return "질문을 입력해 주세요.";
        }
        if (containsProfanity(userPrompt)) {
            return PROFANITY_WARNING;
        }
        Object historyObj = request.get("history");
        if (historyObj instanceof java.util.List<?> historyList) {
            return aiService.askAiWithHistory(userPrompt, historyList);
        }
        return aiService.askAi(userPrompt);
    }

    private boolean containsProfanity(String text) {
        String lowered = text.toLowerCase();
        for (String word : PROFANITY_LIST) {
            if (lowered.contains(word)) {
                return true;
            }
        }
        return false;
    }
}
