package com.example.ex02.Library.service;

import com.example.ex02.Book.entity.BookEntity;
import com.example.ex02.Book.repository.BookRepository;
import com.opencsv.CSVReader;
import jakarta.annotation.PostConstruct;
import java.io.InputStreamReader;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Objects;
import java.util.stream.Collectors;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class LibraryService {
    private static final String CSV_FILE = "서울시_도서관_코드포함.csv";
    private static final String KEY_GU = "구명";

    private final BookRepository bookRepository;

    @Value("${data4library.api-key:}")
    private String data4LibraryKey;

    @Value("${data4library.base-url:http://data4library.kr/api}")
    private String data4LibraryBaseUrl;

    private final List<Map<String, String>> libraryData = new ArrayList<>();

    public LibraryService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource(CSV_FILE);
            try (CSVReader reader = new CSVReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                String[] headers = reader.readNext();
                if (headers == null) {
                    return;
                }
                for (int i = 0; i < headers.length; i += 1) {
                    if (headers[i] != null) {
                        headers[i] = headers[i].replace("\uFEFF", "").trim();
                    }
                }

                String[] line;
                while ((line = reader.readNext()) != null) {
                    Map<String, String> row = new HashMap<>();
                    for (int i = 0; i < headers.length && i < line.length; i += 1) {
                        row.put(headers[i], line[i]);
                    }
                    libraryData.add(row);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<String> getGuList() {
        return libraryData.stream()
                .map(row -> row.get(KEY_GU))
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public List<Map<String, String>> getLibraryData() {
        return libraryData;
    }

    public String searchBooks(String query) {
        String normalized = normalizeQuery(query);
        if (normalized.isBlank()) {
            return emptySearchResponse();
        }

        List<String> tokens = Arrays.stream(normalized.split("\\s+"))
                .map(String::trim)
                .filter(token -> !token.isEmpty())
                .map(String::toLowerCase)
                .collect(Collectors.toList());
        if (tokens.isEmpty()) {
            return emptySearchResponse();
        }

        String firstToken = tokens.get(0);
        List<BookEntity> books = bookRepository
                .findByTitleContainingIgnoreCaseOrIsbnContainingOrAuthorContainingIgnoreCaseOrPublisherContainingIgnoreCase(
                        firstToken,
                        firstToken,
                        firstToken,
                        firstToken
                )
                .stream()
                .filter(book -> matchesAllTokens(book, tokens))
                .collect(Collectors.toList());
        JSONArray docs = new JSONArray();

        for (BookEntity book : books) {
            JSONObject doc = new JSONObject();
            doc.put("bookname", safeValue(book.getTitle()));
            doc.put("authors", safeValue(book.getAuthor()));
            doc.put("publisher", safeValue(book.getPublisher()));
            doc.put("isbn13", safeValue(book.getIsbn()));
            doc.put("isbn", safeValue(book.getIsbn()));
            doc.put("bookImageURL", safeValue(book.getImageUrl()));
            doc.put("bookDtlUrl", "");

            JSONObject wrapper = new JSONObject();
            wrapper.put("doc", doc);
            docs.put(wrapper);
        }

        JSONObject response = new JSONObject();
        response.put("docs", docs);

        JSONObject root = new JSONObject();
        root.put("response", response);
        return root.toString();
    }

    public String checkLoan(String libCode, String isbn) {
        if (libCode == null || libCode.isBlank() || isbn == null || isbn.isBlank()) {
            return emptyLoanResponse();
        }

        String authKey = data4LibraryKey == null ? "" : data4LibraryKey.trim();
        if (authKey.isEmpty()) {
            return emptyLoanResponse();
        }

        String baseUrl = data4LibraryBaseUrl == null || data4LibraryBaseUrl.isBlank()
                ? "http://data4library.kr/api"
                : data4LibraryBaseUrl.trim();

        String url = baseUrl + "/bookExist?authKey=" + authKey
                + "&libCode=" + libCode
                + "&isbn13=" + isbn
                + "&format=json";

        RestTemplate restTemplate = new RestTemplate();
        try {
            String response = restTemplate.getForObject(url, String.class);
            if (response == null || response.isBlank()) {
                return emptyLoanResponse();
            }
            return response;
        } catch (Exception e) {
            return emptyLoanResponse();
        }
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return "";
        }

        String trimmed = query.trim();
        if (trimmed.isEmpty()) {
            return "";
        }

        String decoded = decodePercentIfNeeded(trimmed);
        String fixed = fixMojibake(decoded);
        return fixed.trim();
    }

    private String decodePercentIfNeeded(String value) {
        if (value.contains("%")) {
            try {
                return URLDecoder.decode(value, StandardCharsets.UTF_8);
            } catch (Exception e) {
                return value;
            }
        }
        return value;
    }

    private String fixMojibake(String value) {
        if (!looksLikeMojibake(value)) {
            return value;
        }
        return new String(value.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
    }

    private boolean looksLikeMojibake(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        if (containsKorean(value)) {
            return false;
        }
        for (int i = 0; i < value.length(); i += 1) {
            char ch = value.charAt(i);
            if (ch >= 0x80 && ch <= 0xFF) {
                return true;
            }
        }
        return false;
    }

    private boolean containsKorean(String value) {
        for (int i = 0; i < value.length(); i += 1) {
            char ch = value.charAt(i);
            if ((ch >= 0xAC00 && ch <= 0xD7A3)
                    || (ch >= 0x1100 && ch <= 0x11FF)
                    || (ch >= 0x3130 && ch <= 0x318F)
                    || (ch >= 0xA960 && ch <= 0xA97F)
                    || (ch >= 0xD7B0 && ch <= 0xD7FF)) {
                return true;
            }
        }
        return false;
    }

    private String safeValue(String value) {
        return value == null ? "" : value;
    }

    private boolean matchesAllTokens(BookEntity book, List<String> tokens) {
        String title = safeLower(book.getTitle());
        String author = safeLower(book.getAuthor());
        String isbn = safeLower(book.getIsbn());
        String publisher = safeLower(book.getPublisher());

        for (String token : tokens) {
            if (token.isEmpty()) continue;
            boolean matches = title.contains(token)
                    || author.contains(token)
                    || isbn.contains(token)
                    || publisher.contains(token);
            if (!matches) {
                return false;
            }
        }
        return true;
    }

    private String safeLower(String value) {
        return value == null ? "" : value.toLowerCase();
    }

    private String emptySearchResponse() {
        JSONObject response = new JSONObject();
        response.put("docs", new JSONArray());
        JSONObject root = new JSONObject();
        root.put("response", response);
        return root.toString();
    }

    private String emptyLoanResponse() {
        JSONObject result = new JSONObject();
        result.put("loanAvailable", "N");
        result.put("hasBook", "N");
        JSONObject response = new JSONObject();
        response.put("result", result);
        JSONObject root = new JSONObject();
        root.put("response", response);
        return root.toString();
    }
}


