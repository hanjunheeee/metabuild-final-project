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
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class BookAiService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${tavily.api.key}")
    private String tavilyApiKey;

    private final List<Map<String, String>> bookData = new ArrayList<>();
    private final List<Map<String, String>> chatHistory = new ArrayList<>();

    private final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private final String TAVILY_URL = "https://api.tavily.com/search";

    @PostConstruct
    public void init() {
        ClassPathResource resource = new ClassPathResource("aladin_books_data_delete_html.csv");
        try (CSVReader reader = new CSVReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String[] header = reader.readNext();
            int isbnIdx = -1, titleIdx = -1, authorIdx = -1, summaryIdx = -1;

            for (int i = 0; i < header.length; i++) {
                String h = header[i].toLowerCase();
                if (h.contains("isbn")) isbnIdx = i;
                else if (h.contains("title") || h.equals("제목")) titleIdx = i;
                else if (h.contains("author") || h.equals("저자")) authorIdx = i;
                else if (h.contains("summary") || h.equals("줄거리")) summaryIdx = i;
            }

            String[] line;
            while ((line = reader.readNext()) != null) {
                Map<String, String> book = new HashMap<>();
                book.put("isbn", isbnIdx != -1 && line.length > isbnIdx ? line[isbnIdx].trim() : "");
                book.put("title", titleIdx != -1 && line.length > titleIdx ? line[titleIdx].trim() : "제목없음");
                book.put("author", authorIdx != -1 && line.length > authorIdx ? line[authorIdx].trim() : "저자미상");
                book.put("summary", summaryIdx != -1 && line.length > summaryIdx ? line[summaryIdx].trim() : "내용 정보가 없습니다.");
                bookData.add(book);
            }
        } catch (Exception e) {
            System.err.println("❌ CSV 로드 오류: " + e.getMessage());
        }
    }

    public void resetHistory() {
        this.chatHistory.clear();
    }

    public String askAi(String prompt) {
        String searchResult = searchExternalIsbns(prompt);
        List<String> foundIsbns = extractIsbn13(searchResult);

        List<Map<String, String>> filteredBooks = bookData.stream()
                .filter(book -> foundIsbns.contains(book.get("isbn")))
                .limit(5)
                .collect(Collectors.toList());

        if (filteredBooks.isEmpty()) {
            String[] keywords = prompt.split("\\s+");
            filteredBooks = bookData.stream()
                    .filter(b -> {
                        for (String kw : keywords) {
                            if (kw.length() < 2) continue;
                            if (b.get("title").contains(kw) || b.get("author").contains(kw) || b.get("summary").contains(kw)) {
                                return true;
                            }
                        }
                        return false;
                    })
                    .limit(5)
                    .collect(Collectors.toList());
        }

        return generateChatResponse(prompt, filteredBooks);
    }

    private String searchExternalIsbns(String query) {
        RestTemplate restTemplate = new RestTemplate();
        Map<String, Object> request = new HashMap<>();
        request.put("api_key", tavilyApiKey);
        request.put("query", query + " 도서 추천 ISBN13 정보 포함");
        request.put("search_depth", "advanced");

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(TAVILY_URL, request, Map.class);
            List<Map<String, Object>> results = (List<Map<String, Object>>) response.getBody().get("results");
            return results.stream().map(r -> (String) r.get("content")).collect(Collectors.joining(" "));
        } catch (Exception e) { return ""; }
    }

    private List<String> extractIsbn13(String text) {
        List<String> isbns = new ArrayList<>();
        Matcher matcher = Pattern.compile("\\d{13}").matcher(text);
        while (matcher.find()) { isbns.add(matcher.group()); }
        return isbns;
    }

    private String generateChatResponse(String prompt, List<Map<String, String>> filteredBooks) {
        StringBuilder contextBuilder = new StringBuilder();
        for (Map<String, String> book : filteredBooks) {
            String isbn = book.get("isbn");

            // [핵심 수정] 파라미터 이름을 'isbn'에서 'keyword'로 변경
            // 통합 검색창은 보통 keyword 파라미터를 사용합니다.
            String link = String.format("/searchbook?keyword=%s", isbn);

            contextBuilder.append(String.format("{제목: %s, 저자: %s, 줄거리: %s, 링크: %s}\n",
                    book.get("title"), book.get("author"), book.get("summary"), link));
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                "당신은 도서 추천 전문가입니다.\n" +
                        "1. 추천 시 형식:\n" +
                        "   **제목**: [책제목]\n" +
                        "   * **저자**: [저자명]\n" +
                        "   * **설명**: [7줄 이내]\n" +
                        "   * [이동하기](링크)\n" +
                        "2. 링크는 제공된 형태(/searchbook?isbn=...)를 절대 변경하지 말고 그대로 사용하세요.\n" +
                        "3. 다정하게 답변하세요."));

        messages.addAll(chatHistory);
        String userContent = String.format("[관련 도서 데이터]\n%s\n\n사용자 질문: %s", contextBuilder.toString(), prompt);
        messages.add(Map.of("role", "user", "content", userContent));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "llama-3.1-8b-instant");
        requestBody.put("temperature", 0.5);
        requestBody.put("messages", messages);

        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(groqApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(GROQ_URL, entity, Map.class);
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
            String aiAnswer = (String) ((Map<String, Object>) choices.get(0).get("message")).get("content");

            chatHistory.add(Map.of("role", "user", "content", prompt));
            chatHistory.add(Map.of("role", "assistant", "content", aiAnswer));
            if (chatHistory.size() > 10) { chatHistory.remove(0); chatHistory.remove(0); }

            return aiAnswer;
        } catch (Exception e) { return "죄송해요. 대화 중 오류가 발생했습니다."; }
    }
}