package com.example.ex02.Book.service;

import com.example.ex02.Book.dto.BestsellerItemDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.Locale;

@Service
public class AladinBestsellerService {

    private static final Logger logger = LoggerFactory.getLogger(AladinBestsellerService.class);

    private final String apiKey;
    private final String baseUrl;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AladinBestsellerService(
            @Value("${aladin.api-key:}") String apiKey,
            @Value("${aladin.base-url:https://www.aladin.co.kr/ttb/api/ItemList.aspx}") String baseUrl
    ) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    public List<BestsellerItemDTO> fetchTop10() {
        if (apiKey == null || apiKey.isBlank()) {
            logger.warn("Aladin API key is missing; returning empty bestseller list");
            return Collections.emptyList();
        }

        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();
        int week = now.get(WeekFields.of(Locale.KOREA).weekOfMonth());

        try {
            List<BestsellerItemDTO> weekly = fetchFromUrl(buildWeeklyUrl(year, month, week));
            if (!weekly.isEmpty()) {
                return weekly;
            }

            return fetchFromUrl(buildDefaultUrl());
        } catch (Exception e) {
            logger.error("Failed to fetch Aladin bestsellers: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    private String buildWeeklyUrl(int year, int month, int week) {
        return UriComponentsBuilder.fromHttpUrl(baseUrl)
                .queryParam("ttbkey", apiKey)
                .queryParam("QueryType", "Bestseller")
                .queryParam("MaxResults", 10)
                .queryParam("start", 1)
                .queryParam("SearchTarget", "Book")
                .queryParam("Year", year)
                .queryParam("Month", month)
                .queryParam("Week", week)
                .queryParam("output", "JS")
                .queryParam("Version", "20131101")
                .queryParam("Cover", "Big")
                .build(true)
                .toUriString();
    }

    private String buildDefaultUrl() {
        return UriComponentsBuilder.fromHttpUrl(baseUrl)
                .queryParam("ttbkey", apiKey)
                .queryParam("QueryType", "Bestseller")
                .queryParam("MaxResults", 10)
                .queryParam("start", 1)
                .queryParam("SearchTarget", "Book")
                .queryParam("output", "JS")
                .queryParam("Version", "20131101")
                .queryParam("Cover", "Big")
                .build(true)
                .toUriString();
    }

    private List<BestsellerItemDTO> fetchFromUrl(String url) throws Exception {
        String json = restTemplate.getForObject(url, String.class);
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }

        JsonNode root = objectMapper.readTree(json);
        JsonNode items = root.path("item");
        if (!items.isArray()) {
            return Collections.emptyList();
        }

        List<BestsellerItemDTO> results = new ArrayList<>();
        for (JsonNode item : items) {
            results.add(new BestsellerItemDTO(
                    item.path("title").asText(),
                    item.path("author").asText(),
                    item.path("publisher").asText(),
                    item.path("isbn13").asText(),
                    item.path("cover").asText(),
                    item.path("link").asText()
            ));
        }
        return results;
    }
}
