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
    // 대화 내역 저장소 (연속 대화 및 이유 설명을 위해 유지)
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
            System.out.println("✅ 도서 데이터 로드 완료: " + bookData.size() + "건 (ISBN 검색 지원)");
        } catch (Exception e) {
            System.err.println("❌ CSV 로드 오류: " + e.getMessage());
        }
    }

    public String askAi(String prompt) {
        // 1. 외부 검색을 통한 ISBN 수집
        String searchResult = searchExternalIsbns(prompt);
        List<String> foundIsbns = extractIsbn13(searchResult);

        // 2. 수집된 ISBN 기반 1차 필터링
        List<Map<String, String>> filteredBooks = bookData.stream()
                .filter(book -> foundIsbns.contains(book.get("isbn")))
                .limit(5)
                .collect(Collectors.toList());

        // 3. 필터링 결과가 없으면 키워드 매칭
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

            // [중요 수정] 이제 제목 대신 ISBN을 쿼리 파라미터로 사용하여 정확한 검색 유도
            String link = String.format("http://localhost:3001/searchbook?isbn=%s", isbn);

            contextBuilder.append(String.format("{제목: %s, 저자: %s, 줄거리: %s, 링크: %s}\n",
                    book.get("title"), book.get("author"), book.get("summary"), link));
        }

        List<Map<String, String>> messages = new ArrayList<>();

        // 시스템 프롬프트: 추천 형식 강제 + 이유 설명 능력 부여
        messages.add(Map.of("role", "system", "content",
                "당신은 도서 추천 및 비평 전문가입니다.\n" +
                        "1. 새로운 추천 요청 시에는 반드시 이 형식을 지키세요:\n" +
                        "   **제목**: [책제목]\n" +
                        "   * **저자**: [저자명]\n" +
                        "   * **설명**: [7줄 이내 요약]\n" +
                        "   * [이동하기](링크)\n" +
                        "2. '왜 추천했어?' 혹은 '이유가 뭐야?'와 같은 질문에는 이전 대화 맥락과 제공된 도서 데이터의 줄거리를 분석하여 다정하고 논리적인 이유를 설명하세요. 이때는 위 형식을 지키지 않아도 됩니다.\n" +
                        "3. 답변 시 불필요한 분석 멘트('데이터를 확인해보니...')는 생략하고 바로 핵심 내용을 말하세요.\n" +
                        "4. 링크 정보([이동하기](링크))는 제공된 것을 절대 수정하지 말고 그대로 출력하세요."));

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

            // 기록 업데이트
            chatHistory.add(Map.of("role", "user", "content", prompt));
            chatHistory.add(Map.of("role", "assistant", "content", aiAnswer));
            if (chatHistory.size() > 10) { chatHistory.remove(0); chatHistory.remove(0); }

            return aiAnswer;
        } catch (Exception e) { return "죄송해요. 대화 중 오류가 발생했습니다."; }
    }
}