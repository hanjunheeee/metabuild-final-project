package com.example.ex02.Book.service;

import com.example.ex02.Book.dto.BestsellerItemDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

// Data4Library 대출 랭킹 연동 서비스
@Service
public class Data4LibraryLoanRankingService {

    private static final Logger logger = LoggerFactory.getLogger(Data4LibraryLoanRankingService.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final String apiKey;
    private final String baseUrl;
    private final RestTemplate restTemplate = new RestTemplate();

    public Data4LibraryLoanRankingService(
            @Value("${data4library.api-key:}") String apiKey,
            @Value("${data4library.base-url:http://data4library.kr/api}") String baseUrl
    ) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    // 서울 지역 월간 대출 TOP10 조회
    public List<BestsellerItemDTO> fetchSeoulMonthlyTop10() {
        if (apiKey == null || apiKey.isBlank()) {
            logger.warn("Data4Library loan ranking skipped: missing API key");
            return Collections.emptyList();
        }

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusMonths(1);

        try {
            String url = UriComponentsBuilder.fromHttpUrl(baseUrl)
                    .path("/loanItemSrchByLib")
                    .queryParam("authKey", apiKey)
                    .queryParam("region", "11")
                    .queryParam("pageNo", 1)
                    .queryParam("pageSize", 10)
                    .queryParam("startDt", startDate.format(DATE_FORMAT))
                    .queryParam("endDt", endDate.format(DATE_FORMAT))
                    .build(true)
                    .toUriString();

            String xml = restTemplate.getForObject(url, String.class);
            if (xml == null || xml.isBlank()) {
                logger.warn("Data4Library loan ranking returned empty response");
                return Collections.emptyList();
            }

            return parseXml(xml);
        } catch (Exception e) {
            logger.error("Data4Library loan ranking fetch failed: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    // XML 응답 파싱
    private List<BestsellerItemDTO> parseXml(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(false);
        Document doc = factory.newDocumentBuilder()
                .parse(new InputSource(new StringReader(xml)));

        NodeList docNodes = doc.getElementsByTagName("doc");
        if (docNodes == null || docNodes.getLength() == 0) {
            return Collections.emptyList();
        }

        List<BestsellerItemDTO> results = new ArrayList<>();
        for (int i = 0; i < docNodes.getLength() && results.size() < 10; i++) {
            if (!(docNodes.item(i) instanceof Element)) {
                continue;
            }
            Element item = (Element) docNodes.item(i);
            String title = textOf(item, "bookname");
            String author = textOf(item, "authors");
            String publisher = textOf(item, "publisher");
            String isbn13 = textOf(item, "isbn13");
            String cover = textOf(item, "bookImageURL");
            results.add(new BestsellerItemDTO(title, author, publisher, isbn13, cover, null));
        }
        return results;
    }

    // XML 태그 텍스트 추출
    private String textOf(Element element, String tagName) {
        NodeList nodes = element.getElementsByTagName(tagName);
        if (nodes == null || nodes.getLength() == 0) {
            return null;
        }
        String text = nodes.item(0).getTextContent();
        return text != null ? text.trim() : null;
    }
}
