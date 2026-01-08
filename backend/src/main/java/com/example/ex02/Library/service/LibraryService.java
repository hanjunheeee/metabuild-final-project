package com.example.ex02.Library.service;

import com.opencsv.CSVReader;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import java.util.stream.Collectors;
import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.beans.factory.annotation.Value;
import org.json.JSONObject;
import org.json.JSONArray;
import org.springframework.web.client.RestTemplate;
import jakarta.annotation.PostConstruct;
import java.io.InputStreamReader;
import java.util.*;

@Service
public class LibraryService {
    private final String AUTH_KEY = "346fddca53df75812af46d8b26ce9dbf909382798b9726a088b5924bebd47fb7";
    @Value("${kakao.api-key:}")
    private String kakaoApiKey;
    private List<Map<String, String>> libraryData = new ArrayList<>();

    // 서버 시작 시 CSV 파일을 메모리에 로드 (pandas 역할)
    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("서울시_도서관_코드포함.csv");
            try (CSVReader reader = new CSVReader(new InputStreamReader(resource.getInputStream(), "UTF-8"))) {
                String[] headers = reader.readNext();
                String[] line;
                while ((line = reader.readNext()) != null) {
                    Map<String, String> row = new HashMap<>();
                    for (int i = 0; i < headers.length; i++) {
                        row.put(headers[i], line[i]);
                    }
                    libraryData.add(row);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // 구 리스트 추출
    public List<String> getGuList() {
        return libraryData.stream().map(m -> m.get("구명")).distinct().sorted().toList();
    }

    // 도서관 전체 데이터 반환
    public List<Map<String, String>> getLibraryData() {
        return libraryData;
    }

    // [Flask의 search_book 대응] 책 제목 검색 API
    public String searchBooks(String query) {
        if (query == null || query.isBlank()) {
            return "{\"response\":{\"docs\":[]}}";
        }

        String url = "http://data4library.kr/api/srchBooks?authKey=" + AUTH_KEY +
                "&title=" + query.replace(" ", "") + "&pageSize=5&format=json";
        RestTemplate restTemplate = new RestTemplate();
        return restTemplate.getForObject(url, String.class);
    }

    // [Flask의 check_loan 대응] 실시간 대출 가능 여부 확인 API
    // LibraryService.java의 checkLoan 메소드 수정
    public String checkLoan(String libCode, String isbn) {
        String url = "http://data4library.kr/api/bookExist?authKey=" + AUTH_KEY +
                "&libCode=" + libCode + "&isbn13=" + isbn + "&format=json";
        RestTemplate restTemplate = new RestTemplate();
        try {
            String response = restTemplate.getForObject(url, String.class);
            // 서버 콘솔(IntelliJ)에서 API 응답 내용을 직접 확인하기 위한 로그
            System.out.println("도서관코드: " + libCode + " | 응답: " + response);
            return response;
        } catch (Exception e) {
            return "{\"response\":{\"result\":{\"loanAvailable\":\"N\"}}}";
        }
    }
}


