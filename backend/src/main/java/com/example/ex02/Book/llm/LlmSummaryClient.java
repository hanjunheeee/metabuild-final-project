package com.example.ex02.Book.llm;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// Gemini API 호출 클라이언트
@Service
public class LlmSummaryClient {

    private static final Logger logger = LoggerFactory.getLogger(LlmSummaryClient.class);

    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final RestTemplate restTemplate = new RestTemplate();

    public LlmSummaryClient(
            @Value("${llm.gemini.api-key:}") String apiKey,
            @Value("${llm.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
            @Value("${llm.gemini.model:gemini-1.5-flash}") String model
    ) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.model = model;
    }

    // 프롬프트 기반 요약 생성
    public String summarize(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            logger.warn("Gemini summarize skipped: empty prompt");
            return null;
        }
        if (apiKey == null || apiKey.isBlank()) {
            logger.warn("Gemini summarize skipped: missing API key");
            return null;
        }

        String url = String.format(
                "%s/models/%s:generateContent?key=%s",
                baseUrl,
                model,
                apiKey
        );

        GeminiRequest request = GeminiRequest.fromPrompt(prompt);

        try {
            GeminiResponse response = restTemplate.postForObject(url, request, GeminiResponse.class);
            String text = response != null ? response.firstText() : null;
            if (text == null || text.isBlank()) {
                logger.warn("Gemini response is empty");
            } else {
                logger.info("Gemini summary generated (length={})", text.length());
            }
            return text;
        } catch (Exception e) {
            logger.error("Gemini summarize failed: {}", e.getMessage(), e);
            return null;
        }
    }
}
