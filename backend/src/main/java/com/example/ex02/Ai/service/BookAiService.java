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
                book.put("author", authorIdx != -1 && line.length > authorIdx ? cleanText(line[authorIdx]) : "저자없음");
                book.put("summary", summaryIdx != -1 && line.length > summaryIdx ? cleanText(line[summaryIdx]) : "내용 정보가 없습니다.");
                bookData.add(book);
            }
        } catch (Exception e) {
            System.err.println("CSV 로드 오류: " + e.getMessage());
        }
    }

    private String cleanText(String text) {
        if (text == null) return "";
        return text.trim().replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "");
    }

    private String normalizeKeyword(String text) {
        if (text == null) return "";
        return text.replaceAll("\\s+", "")
                .replaceAll("(작가|저자|저|지음|글|역|번역|엮음|감수)", "")
                .toLowerCase();
    }

    private String normalizeAuthor(String text) {
        return normalizeKeyword(text);
    }

    public void resetHistory() {
        this.chatHistory.clear();
        this.recommendedIsbns.clear();
    }

    public String askAiWithHistory(String prompt, List<?> historyList) {
        List<Map<String, String>> history = new ArrayList<>();
        if (historyList != null) {
            for (Object item : historyList) {
                if (item instanceof Map<?, ?> map) {
                    Object roleObj = map.get("role");
                    Object contentObj = map.get("content");
                    String role = roleObj == null ? "" : roleObj.toString();
                    String content = contentObj == null ? "" : contentObj.toString();
                    if (content.isBlank()) continue;
                    if ("ai".equalsIgnoreCase(role)) {
                        role = "assistant";
                    } else if (!"assistant".equalsIgnoreCase(role) && !"user".equalsIgnoreCase(role)) {
                        role = "user";
                    }
                    history.add(Map.of("role", role.toLowerCase(), "content", content));
                }
            }
        }
        if (history.size() > 8) {
            history = history.subList(history.size() - 8, history.size());
        }
        return askAi(prompt, history);
    }

    public String askAi(String prompt) {
        return askAi(prompt, null);
    }

    private String askAi(String prompt, List<Map<String, String>> externalHistory) {
        // 불필요한 요청어 제거 후 핵심 키워드만 추출
        String cleanPrompt = prompt
                .replaceAll("([\\p{IsHangul}A-Za-z0-9]+)(작가|저자)", "$1")
                .replaceAll("(추천|해줘|있어|알려|도서|책|권|혹시|다른|작가|저자|저|지음|글|역|번역|엮음|감수)", " ")
                .trim();
        String[] keywords = cleanPrompt.split("\\s+");

        List<Map<String, String>> filteredBooks = bookData.stream()
                .filter(b -> {
                    boolean matches = false;
                    String normalizedAuthor = normalizeAuthor(b.get("author"));
                    String normalizedTitle = normalizeKeyword(b.get("title"));
                    for (String kw : keywords) {
                        String normalizedKw = normalizeKeyword(kw);
                        if (normalizedKw.isEmpty()) continue;
                        if (kw.length() < 1) continue;
                        if (normalizedAuthor.contains(normalizedKw) || normalizedTitle.contains(normalizedKw)) {
                            matches = true;
                            break;
                        }
                    }

                    if (prompt.contains("다른") || prompt.contains("다시") || prompt.contains("새로")) {
                        return matches && !recommendedIsbns.contains(b.get("isbn"));
                    }
                    return matches;
                })
                .limit(5)
                .collect(Collectors.toList());

        if (filteredBooks.isEmpty()) {
            filteredBooks = bookData.stream()
                    .filter(b -> {
                        for (String kw : keywords) {
                            String normalizedKw = normalizeKeyword(kw);
                            if (normalizedKw.length() < 2) continue;
                            if (normalizeKeyword(b.get("summary")).contains(normalizedKw)) return true;
                        }
                        return false;
                    })
                    .limit(5)
                    .collect(Collectors.toList());
        }

        return generateChatResponse(prompt, filteredBooks, externalHistory);
    }

    private String searchExternalIsbns(String query) {
        RestTemplate restTemplate = new RestTemplate();
        Map<String, Object> request = new HashMap<>();
        request.put("api_key", tavilyApiKey);
        request.put("query", query + " 도서 추천 ISBN13");
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

    private String generateChatResponse(String prompt, List<Map<String, String>> filteredBooks, List<Map<String, String>> externalHistory) {
        StringBuilder contextBuilder = new StringBuilder();
        if (filteredBooks.isEmpty()) {
            contextBuilder.append("데이터베이스에 해당 조건에 맞는 도서가 없습니다. 다른 키워드로 다시 추천해 주세요.");
        } else {
            for (Map<String, String> book : filteredBooks) {
                String isbn = book.get("isbn");
                String link = String.format("/searchbook?keyword=%s", isbn);
                contextBuilder.append(String.format("{제목: %s, 저자: %s, 줄거리: %s, 링크: %s, ISBN: %s}\n",
                        book.get("title"), book.get("author"), book.get("summary"), link, isbn));
            }
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                "당신은 도서 추천 전문가입니다.\n" +
                        "1. **중요 규칙: 제공한 [관련 도서 정보]에 있는 책만 추천하세요**. 그 외의 책은 언급하지 마세요.\n" +
                        "2. 사용자 질문(저자명, 제목 등)이 [관련 도서 정보]와 일치하지 않으면 추천하지 말고 일치하는 게 없다고 답하세요.\n" +
                        "3. 추천 형식은 반드시 아래 형식을 지키세요.\n\n" +
                        "   **제목**: [책 제목]\n" +
                        "   **저자**: [저자명]\n" +
                        "   **설명**: [7줄 이내 요약]\n" +
                        "   [이동하기](링크)\n\n" +
                        "4. 링크 주소는 그대로 사용하고 다른 주소로 바꾸지 마세요. (/searchbook?keyword=...)\n" +
                        "5. 인사말은 제외하고 도서 리스트 이전에는 연결 문구를 쓰지 마세요."));

        messages.addAll((externalHistory != null && !externalHistory.isEmpty()) ? externalHistory : chatHistory);
        String userContent = String.format("[관련 도서 정보]\n%s\n\n사용자 질문: %s\n질문과 일치하는 도서만 추천하고, 관련 없는 도서는 추천하지 마세요.", contextBuilder.toString(), prompt);
        messages.add(Map.of("role", "user", "content", userContent));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "llama-3.3-70b-versatile");
        requestBody.put("temperature", 0.1); // 정확도 유지를 위해 온도 낮춤
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

            for (Map<String, String> book : filteredBooks) {
                if (aiAnswer.contains(book.get("title"))) {
                    recommendedIsbns.add(book.get("isbn"));
                }
            }

            chatHistory.add(Map.of("role", "user", "content", prompt));
            chatHistory.add(Map.of("role", "assistant", "content", aiAnswer));
            if (chatHistory.size() > 10) { chatHistory.remove(0); chatHistory.remove(0); }

            return aiAnswer;
        } catch (Exception e) { return "죄송해요. 처리 중 오류가 발생했습니다."; }
    }
}
