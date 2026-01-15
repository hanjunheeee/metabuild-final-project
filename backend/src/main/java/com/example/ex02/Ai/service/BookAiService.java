package com.example.ex02.Ai.service;

import com.opencsv.CSVReader;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.InputStreamReader;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BookAiService {

    @Value("${groq.api.key}")
    private String apiKey;

    private final List<Map<String, String>> bookData = new ArrayList<>();
    private final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    @PostConstruct
    public void init() {
        // resources 폴더 내의 파일을 읽기 위해 ClassPathResource 사용
        ClassPathResource resource = new ClassPathResource("aladin_books_data_delete_html.csv");
        try (CSVReader reader = new CSVReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            reader.readNext(); // 헤더 스킵
            String[] line;
            while ((line = reader.readNext()) != null) {
                Map<String, String> book = new HashMap<>();
                // CSV 컬럼 순서: 1번 제목, 2번 저자, 3번 요약
                book.put("title", line.length > 1 ? line[1].trim() : "제목없음");
                book.put("author", line.length > 2 ? line[2].trim() : "저자미상");
                book.put("summary", line.length > 3 ? line[3].trim() : "내용 정보가 없습니다.");
                bookData.add(book);
            }
            System.out.println("✅ 도서 데이터 로드 완료: " + bookData.size() + "건");
        } catch (Exception e) {
            System.err.println("❌ CSV 로드 오류: " + e.getMessage());
        }
    }

    public String askAi(String prompt) {
        RestTemplate restTemplate = new RestTemplate();

        String normalizedPrompt = normalizeText(prompt);
        List<String> tokens = Arrays.stream(normalizedPrompt.split("\\s+"))
                .filter(token -> !token.isBlank())
                .toList();

        // 키워드 필터링 (간단한 RAG 구현)
        List<Map<String, String>> filteredBooks = bookData.stream()
                .filter(b -> {
                    String title = normalizeText(b.get("title"));
                    String summary = normalizeText(b.get("summary"));
                    String author = normalizeText(b.get("author"));
                    if (title.contains(normalizedPrompt)
                            || summary.contains(normalizedPrompt)
                            || author.contains(normalizedPrompt)) {
                        return true;
                    }
                    return tokens.stream().anyMatch(token ->
                            title.contains(token) || summary.contains(token) || author.contains(token));
                })
                .limit(5)
                .collect(Collectors.toList());

        if (filteredBooks.isEmpty()) {
            Collections.shuffle(bookData);
            filteredBooks = bookData.stream().limit(5).collect(Collectors.toList());
        }

        StringBuilder contextBuilder = new StringBuilder();
        for (Map<String, String> book : filteredBooks) {
            String encodedTitle = URLEncoder.encode(book.get("title"), StandardCharsets.UTF_8);
            // 리액트 서버(3001)의 검색 페이지로 연결되는 링크 생성
            String link = String.format("[상세페이지 바로가기](http://localhost:3001/searchbook?keyword=%s)", encodedTitle);

            contextBuilder.append(String.format("{제목: %s, 저자: %s, 줄거리: %s, 링크: %s}\n",
                    book.get("title"), book.get("author"), book.get("summary"), link));
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "llama-3.1-8b-instant");
        requestBody.put("temperature", 0.0);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                "당신은 도서 추천 전문가입니다. 반드시 제공된 데이터의 내용을 토대로 답변하세요.\n" +
                        "사용자가 요청하면 다음 형식을 엄격히 지켜 답변하세요.\n\n" +
                        "답변 형식: 1. **제목** - 저자: 줄거리내용 [상세페이지 바로가기](링크)\n\n" +
                        "주의사항:\n" +
                        "- 제공된 데이터 외의 정보는 지어내지 마세요.\n" +
                        "- 줄거리는 핵심만 요약해서 간결하게 답변하세요.\n\n" +
                        "[추천 데이터]\n" + contextBuilder.toString()));
        messages.add(Map.of("role", "user", "content", prompt));

        requestBody.put("messages", messages);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(GROQ_URL, entity, Map.class);
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
            return (String) ((Map<String, Object>) choices.get(0).get("message")).get("content");
        } catch (Exception e) {
            return "추천 도서를 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        }
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        return text
                .toLowerCase(java.util.Locale.ROOT)
                .replaceAll("[\\p{Punct}]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}

