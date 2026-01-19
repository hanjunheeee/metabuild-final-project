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
    private final Set<String> recommendedIsbns = new HashSet<>();

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
                book.put("isbn", isbnIdx != -1 && line.length > isbnIdx ? line[isbnIdx].trim().replaceAll("[^0-9]", "") : "");
                book.put("title", titleIdx != -1 && line.length > titleIdx ? cleanText(line[titleIdx]) : "제목없음");
                book.put("author", authorIdx != -1 && line.length > authorIdx ? cleanText(line[authorIdx]) : "저자미상");
                book.put("summary", summaryIdx != -1 && line.length > summaryIdx ? cleanText(line[summaryIdx]) : "내용 정보가 없습니다.");
                bookData.add(book);
            }
        } catch (Exception e) {
            System.err.println("❌ CSV 로드 오류: " + e.getMessage());
        }
    }

    private String cleanText(String text) {
        if (text == null) return "";
        return text.trim().replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "");
    }

    public void resetHistory() {
        this.chatHistory.clear();
        this.recommendedIsbns.clear();
    }

    public String askAi(String prompt) {
        // 검색용 키워드 정제
        String cleanPrompt = prompt.replaceAll("(추천|해줘|있어|알려|작가|도서|책|의|한권|다시|다른|장르|알려줘)", " ").trim();
        String[] keywords = cleanPrompt.split("\\s+");

        // 제목, 저자, 줄거리를 모두 포함하여 검색 (장르 검색 대응)
        List<Map<String, String>> filteredBooks = bookData.stream()
                .filter(b -> {
                    boolean matches = false;
                    for (String kw : keywords) {
                        if (kw.length() < 1) continue;
                        // 장르 검색('공포', '로맨스')을 위해 summary 검색 비중을 높임
                        if (b.get("author").contains(kw) || b.get("title").contains(kw) || b.get("summary").contains(kw)) {
                            matches = true;
                            break;
                        }
                    }

                    // 중복 제거 로직
                    if (prompt.contains("다른") || prompt.contains("다시") || prompt.contains("새로운")) {
                        return matches && !recommendedIsbns.contains(b.get("isbn"));
                    }
                    return matches;
                })
                .limit(10) // AI가 선택할 수 있게 후보군을 늘림
                .collect(Collectors.toList());

        return generateChatResponse(prompt, filteredBooks);
    }

    private String generateChatResponse(String prompt, List<Map<String, String>> filteredBooks) {
        StringBuilder contextBuilder = new StringBuilder();

        if (filteredBooks.isEmpty()) {
            contextBuilder.append("제공된 데이터에 사용자의 요청(장르, 저자 등)과 일치하는 도서가 단 하나도 없습니다.");
        } else {
            for (Map<String, String> book : filteredBooks) {
                String isbn = book.get("isbn");
                String link = String.format("/searchbook?keyword=%s", isbn);
                contextBuilder.append(String.format("{제목: %s, 저자: %s, 줄거리: %s, 링크: %s}\n",
                        book.get("title"), book.get("author"), book.get("summary"), link));
            }
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                "당신은 도서 추천 전문가입니다.\n" +
                        "1. **중요 규칙: 반드시 전달받은 [관련 도서 데이터] 목록에 있는 책만 추천하세요. 데이터에 없는 책을 지어내면 절대 안 됩니다.**\n" +
                        "2. 만약 [관련 도서 데이터]가 비어있거나 질문과 상관없다면, 책을 추천하지 말고 \"찾으시는 장르나 작가의 도서가 데이터베이스에 없습니다.\"라고 정중히 답하세요.\n" +
                        "3. 추천 형식은 아래를 엄격히 지키세요.\n\n" +
                        "   **제목**: [책제목]\n" +
                        "   **저자**: [저자명]\n" +
                        "   **설명**: [7줄 이내 요약]\n" +
                        "   [이동하기](링크)\n\n" +
                        "4. 링크 주소는 반드시 /searchbook?keyword=ISBN 형태여야 하며, 제공된 데이터를 절대 수정하지 마세요.\n" +
                        "5. 한국어로만 답변하고, 인사말을 제외한 도서 리스트 사이에는 어떠한 연결 문구도 넣지 마세요."));

        // 대화 이력 추가
        messages.addAll(chatHistory);

        String userContent = String.format("[관련 도서 데이터]\n%s\n\n사용자 질문: %s\n위 데이터 중에서 질문과 가장 일치하는 책을 골라 추천해줘. 데이터에 없으면 없다고 말해.", contextBuilder.toString(), prompt);
        messages.add(Map.of("role", "user", "content", userContent));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "llama-3.3-70b-versatile");
        requestBody.put("temperature", 0.0); // 환각 방지를 위해 온도를 0으로 고정
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

            // 추천된 ISBN 추적
            for (Map<String, String> book : filteredBooks) {
                if (aiAnswer.contains(book.get("title"))) {
                    recommendedIsbns.add(book.get("isbn"));
                }
            }

            chatHistory.add(Map.of("role", "user", "content", prompt));
            chatHistory.add(Map.of("role", "assistant", "content", aiAnswer));
            if (chatHistory.size() > 10) { chatHistory.remove(0); chatHistory.remove(0); }

            return aiAnswer;
        } catch (Exception e) { return "죄송해요. 대화 중 오류가 발생했습니다."; }
    }
}