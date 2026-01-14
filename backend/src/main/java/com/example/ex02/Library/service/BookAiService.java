package com.example.ex02.Library.service;

import com.opencsv.CSVReader;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.FileReader;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BookAiService {

    @Value("${groq.api.key}")
    private String apiKey;

    // 도서 데이터를 담을 메모리 저장소
    private final List<Map<String, String>> bookData = new ArrayList<>();
    private final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    // 1. 서버 시작 시 CSV 데이터를 메모리에 로드
    @PostConstruct
    public void init() {
        // 파일 경로를 프로젝트 구조에 맞게 수정하세요 (예: src/main/resources/...)
        String csvFilePath = "src/main/resources/aladin_books_data_delete_html.csv";

        try (CSVReader reader = new CSVReader(new FileReader(csvFilePath))) {
            String[] headers = reader.readNext(); // 첫 줄(헤더) 건너뛰기
            String[] line;
            while ((line = reader.readNext()) != null) {
                Map<String, String> book = new HashMap<>();
                // CSV 컬럼 순서에 따라 매핑 (0: 제목, 1: 저자, 2: 요약)
                book.put("title", line.length > 0 ? line[0] : "");
                book.put("author", line.length > 1 ? line[1] : "");
                book.put("summary", line.length > 2 ? line[2] : "줄거리 정보가 없습니다.");
                bookData.add(book);
            }
            System.out.println("✅ CSV 로드 완료: " + bookData.size() + "권");
        } catch (Exception e) {
            System.err.println("❌ CSV 로드 중 오류 발생: " + e.getMessage());
        }
    }

    public String askAi(String prompt) {
        RestTemplate restTemplate = new RestTemplate();

        // 2. 검색 로직: 사용자의 질문이 제목이나 줄거리에 포함된 데이터 필터링
        List<Map<String, String>> filteredBooks = bookData.stream()
                .filter(b -> b.get("title").contains(prompt) || b.get("summary").contains(prompt))
                .limit(10)
                .collect(Collectors.toList());

        // 검색 결과가 너무 적을 경우 랜덤하게 보충 (선택 사항)
        if (filteredBooks.size() < 3) {
            Collections.shuffle(bookData);
            filteredBooks.addAll(bookData.stream().limit(5).collect(Collectors.toList()));
        }

        // 3. AI에게 제공할 컨텍스트 및 마크다운 링크(full_link_tag) 생성
        StringBuilder contextBuilder = new StringBuilder();
        for (Map<String, String> book : filteredBooks) {
            String encodedTitle = URLEncoder.encode(book.get("title"), StandardCharsets.UTF_8);
            String linkTag = String.format("[상세페이지 바로가기](http://localhost:3001/searchbook?keyword=%s)", encodedTitle);

            contextBuilder.append(String.format("제목: %s | 저자: %s | 요약: %s | full_link_tag: %s\n\n",
                    book.get("title"), book.get("author"), book.get("summary"), linkTag));
        }

        // 4. Groq API 요청 바디 구성
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "llama-3.1-8b-instant");
        requestBody.put("temperature", 0.2); // 일관된 답변을 위해 낮게 설정

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                "당신은 친절한 도서 추천 전문가입니다. 아래 제공된 도서 리스트를 기반으로 추천하세요.\n" +
                        "반드시 한국어로 답변하고, 각 도서 추천 시 제공된 'full_link_tag'를 수정 없이 그대로 출력하세요.\n\n" +
                        "[도서 리스트]\n" + contextBuilder.toString()));
        messages.add(Map.of("role", "user", "content", prompt));

        requestBody.put("messages", messages);

        // 5. HTTP 헤더 설정 및 API 호출
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(GROQ_URL, entity, Map.class);

            // 6. JSON 응답에서 메시지 내용 추출 (choices -> message -> content)
            if (response.getBody() != null && response.getBody().containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                return (String) message.get("content");
            }
        } catch (Exception e) {
            return "AI 추천 중 오류가 발생했습니다: " + e.getMessage();
        }

        return "추천 결과를 가져올 수 없습니다.";
    }
}