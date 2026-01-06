package com.example.ex02.Book.external;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;

@Service
public class Data4LibraryClient {

    private static final Logger logger = LoggerFactory.getLogger(Data4LibraryClient.class);

    private final String apiKey;
    private final String baseUrl;
    private final RestTemplate restTemplate = new RestTemplate();

    public Data4LibraryClient(
            @Value("${data4library.api-key:}") String apiKey,
            @Value("${data4library.base-url:http://data4library.kr/api}") String baseUrl
    ) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    public Data4LibraryBookInfo fetchByIsbn13(String isbn13) {
        if (isbn13 == null || isbn13.isBlank()) {
            logger.warn("Data4Library fetch skipped: empty isbn13");
            return null;
        }
        if (apiKey == null || apiKey.isBlank()) {
            logger.warn("Data4Library fetch skipped: missing API key");
            return null;
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl(baseUrl)
                    .path("/srchDtlList")
                    .queryParam("authKey", apiKey)
                    .queryParam("isbn13", isbn13)
                    .queryParam("loaninfoYN", "Y")
                    .build(true)
                    .toUriString();

            String xml = restTemplate.getForObject(url, String.class);
            if (xml == null || xml.isBlank()) {
                logger.warn("Data4Library returned empty response for isbn13={}", isbn13);
                return null;
            }

            return parseXml(xml);
        } catch (Exception e) {
            logger.error("Data4Library fetch failed for isbn13={}: {}", isbn13, e.getMessage(), e);
            return null;
        }
    }

    private Data4LibraryBookInfo parseXml(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(false);

        Document doc = factory.newDocumentBuilder()
                .parse(new InputSource(new StringReader(xml)));

        String title = firstTagText(doc, "bookname");
        String authors = firstTagText(doc, "authors");
        String publisher = firstTagText(doc, "publisher");
        String publicationYear = firstTagText(doc, "publication_year");
        String description = firstTagText(doc, "description");

        if (isBlank(title) && isBlank(authors) && isBlank(description)) {
            logger.warn("Data4Library parsed empty book info");
            return null;
        }

        return new Data4LibraryBookInfo(
                title,
                authors,
                publisher,
                publicationYear,
                description
        );
    }

    private String firstTagText(Document doc, String tagName) {
        NodeList nodes = doc.getElementsByTagName(tagName);
        if (nodes == null || nodes.getLength() == 0) {
            return null;
        }
        String text = nodes.item(0).getTextContent();
        return text != null ? text.trim() : null;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
