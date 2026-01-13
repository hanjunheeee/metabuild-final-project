package com.example.ex02.Book.service;

import com.example.ex02.Book.dto.BestsellerItemDTO;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

import java.io.ByteArrayInputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// 교보/YES24 베스트셀러 스크래핑 서비스(캐시 포함)
@Service
public class StoreBestsellerScrapeService {

    private static final Logger logger = LoggerFactory.getLogger(StoreBestsellerScrapeService.class);
    private static final Duration CACHE_TTL = Duration.ofHours(6);
    private static final int KYOBO_TIMEOUT_MS = 25000;
    private static final int KYOBO_RETRY_COUNT = 3;
    private static final long KYOBO_RETRY_DELAY_MS = 700L;
    private static final String KYOBO_EXCEL_URL = "https://store.kyobobook.co.kr/api/gw/best//downloads/excel";

    private final RestTemplate restTemplate = new RestTemplate();
    private static class CacheEntry {
        private final List<BestsellerItemDTO> items;
        private final Instant fetchedAt;

        private CacheEntry(List<BestsellerItemDTO> items, Instant fetchedAt) {
            this.items = items;
            this.fetchedAt = fetchedAt;
        }
    }

    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    // 교보 베스트셀러 TOP10 조회
    public List<BestsellerItemDTO> fetchKyoboTop10() {
        return getOrFetch("KYOBO", this::scrapeKyoboTop10);
    }

    // YES24 베스트셀러 TOP10 조회
    public List<BestsellerItemDTO> fetchYes24Top10() {
        return getOrFetch("YES24", this::scrapeYes24Top10);
    }

    // 캐시 우선 조회 후 필요 시 재수집
    private List<BestsellerItemDTO> getOrFetch(String key, Fetcher fetcher) {
        CacheEntry cached = cache.get(key);
        if (cached != null && !isExpired(cached.fetchedAt)) {
            return cached.items;
        }

        List<BestsellerItemDTO> fresh = fetcher.fetch();
        if (!fresh.isEmpty()) {
            cache.put(key, new CacheEntry(fresh, Instant.now()));
            return fresh;
        }
        if (cached != null && !cached.items.isEmpty()) {
            logger.warn("{} bestseller fetch failed; using cached data", key);
            return cached.items;
        }
        return fresh;
    }

    private boolean isExpired(Instant fetchedAt) {
        return fetchedAt.plus(CACHE_TTL).isBefore(Instant.now());
    }

    // 교보 베스트셀러 수집(엑셀/스토어/모바일/레거시 순)
    private List<BestsellerItemDTO> scrapeKyoboTop10() {
        List<BestsellerItemDTO> excel = fetchKyoboExcelTop10();
        if (!excel.isEmpty()) {
            return excel;
        }

        List<BestsellerItemDTO> store = scrapeKyoboStoreTop10();
        if (!store.isEmpty()) {
            return store;
        }

        String url = "https://product.kyobobook.co.kr/bestseller/total?period=001";
        try {
            Document doc = fetchDocumentWithRetries(url, "https://product.kyobobook.co.kr", KYOBO_TIMEOUT_MS);

            List<BestsellerItemDTO> results = extractKyoboItems(doc);
            if (!results.isEmpty()) {
                return results;
            }
        } catch (Exception e) {
            logger.error("Kyobo bestseller scrape failed: {}", e.getMessage(), e);
        }

        List<BestsellerItemDTO> mobile = scrapeKyoboMobileTop10();
        if (!mobile.isEmpty()) {
            return mobile;
        }
        return scrapeKyoboLegacyTop10();
    }

    private List<BestsellerItemDTO> scrapeKyoboMobileTop10() {
        String url = "https://m.kyobobook.co.kr/bestseller/total?period=001";
        try {
            Document doc = fetchDocumentWithRetries(url, "https://m.kyobobook.co.kr", KYOBO_TIMEOUT_MS);

            List<BestsellerItemDTO> results = extractKyoboItems(doc);
            if (results.isEmpty()) {
                logger.warn("Kyobo bestseller scrape returned no items");
            }
            return results;
        } catch (Exception e) {
            logger.error("Kyobo bestseller scrape failed: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    // YES24 베스트셀러 수집
    private List<BestsellerItemDTO> scrapeYes24Top10() {
        String url = "https://www.yes24.com/Product/Category/BestSeller?categoryNumber=001&sumgb=07";
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0")
                    .referrer("https://www.yes24.com")
                    .timeout(7000)
                    .get();

            Elements items = doc.select("#yesBestList li, .cCont_list li, .bestSellerList li, .itemUnit");
            if (items.isEmpty()) {
                logger.warn("YES24 bestseller scrape returned no items");
                return Collections.emptyList();
            }

            List<BestsellerItemDTO> results = new ArrayList<>();
            List<String> seenTitles = new ArrayList<>();
            for (Element item : items) {
                if (results.size() >= 10) break;

                String title = textOf(item.selectFirst("a.gd_name"));
                if (title.isBlank()) {
                    title = textOf(item.selectFirst(".gd_name, .goods_name, .goods_name a, .item_tit a"));
                }
                if (title.isBlank()) continue;
                if (seenTitles.contains(title)) continue;
                seenTitles.add(title);

                String author = textOf(item.selectFirst(".info_auth, .auth, .pubGrp .auth"));
                String publisher = textOf(item.selectFirst(".info_pub, .pub, .pubGrp .pub"));

                Element coverEl = item.selectFirst(".gd_img img, .goodsImgW img, .imgBdr img, img");
                String cover = attrOf(coverEl, "data-original");
                if (cover.isBlank()) {
                    cover = attrOf(coverEl, "data-src");
                }
                if (cover.isBlank()) {
                    cover = attrOf(coverEl, "src");
                }
                cover = normalizeUrl(cover);

                String link = attrOf(item.selectFirst("a.gd_name, .gd_name a, .goods_name a, .item_tit a"), "href");
                link = normalizeUrl(link);

                results.add(new BestsellerItemDTO(title, author, publisher, "", cover, link));
            }
            return results;
        } catch (Exception e) {
            logger.error("YES24 bestseller scrape failed: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    private List<BestsellerItemDTO> scrapeKyoboStoreTop10() {
        String url = "https://store.kyobobook.co.kr/bestseller/total/weekly";
        try {
            Document doc = fetchDocumentWithRetries(url, "https://store.kyobobook.co.kr", KYOBO_TIMEOUT_MS);
            logKyoboDocDebug(doc, "store-weekly");
            Elements items = doc.select("ol.grid li");
            if (items.isEmpty()) {
                logger.warn("Kyobo store scrape returned no items");
                return Collections.emptyList();
            }

            List<BestsellerItemDTO> results = new ArrayList<>();
            List<String> seenTitles = new ArrayList<>();
            for (Element item : items) {
                if (results.size() >= 10) break;

                Element titleEl = item.selectFirst("a.prod_link.line-clamp-2, a.prod_link.line-clamp-2.font-medium");
                String title = textOf(titleEl);
                if (title.isBlank()) {
                    title = textOf(item.selectFirst("a.prod_link[href*='/detail/']"));
                }
                if (title.isBlank()) {
                    title = attrOf(item.selectFirst("a.prod_link img[alt]"), "alt");
                }
                if (title.isBlank()) continue;
                if (seenTitles.contains(title)) continue;
                seenTitles.add(title);

                String meta = textOf(item.selectFirst("div.line-clamp-2.flex, div.line-clamp-2"));
                String[] metaParts = splitMeta(meta);
                String author = metaParts[0];
                String publisher = metaParts[1];

                Element coverEl = item.selectFirst("a.prod_link img[src]");
                String cover = attrOf(coverEl, "src");
                cover = normalizeUrl(cover);

                String link = attrOf(titleEl, "href");
                link = normalizeUrl(link);

                results.add(new BestsellerItemDTO(title, author, publisher, "", cover, link));
            }

            if (results.isEmpty()) {
                logger.warn("Kyobo store scrape returned no items after parsing");
            }
            return results;
        } catch (Exception e) {
            logger.error("Kyobo store scrape failed: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    // 교보 엑셀 다운로드 기반 수집
    private List<BestsellerItemDTO> fetchKyoboExcelTop10() {
        try {
            String url = KYOBO_EXCEL_URL
                    + "?period=002&bsslBksClstCode=A&bestSeller=01";

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            headers.set("Accept", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

            ResponseEntity<byte[]> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    byte[].class
            );

            byte[] body = response.getBody();
            if (body == null || body.length == 0) {
                logger.warn("Kyobo excel response is empty");
                return Collections.emptyList();
            }

            return parseKyoboExcel(body);
        } catch (Exception e) {
            logger.warn("Kyobo excel fetch failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    // 교보 엑셀 파싱
    private List<BestsellerItemDTO> parseKyoboExcel(byte[] data) {
        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(data))) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                return Collections.emptyList();
            }

            DataFormatter formatter = new DataFormatter();
            Row header = sheet.getRow(sheet.getFirstRowNum());
            Map<String, Integer> columns = mapKyoboExcelColumns(header, formatter);

            List<BestsellerItemDTO> results = new ArrayList<>();
            int startRow = header == null ? sheet.getFirstRowNum() : header.getRowNum() + 1;

            for (int i = startRow; i <= sheet.getLastRowNum() && results.size() < 10; i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String title = cellValue(row, columns.get("title"), formatter);
                if (title.isBlank()) continue;

                String author = cellValue(row, columns.get("author"), formatter);
                String publisher = cellValue(row, columns.get("publisher"), formatter);
                String isbn = cellValue(row, columns.get("isbn13"), formatter);
                if (isbn.isBlank()) {
                    isbn = cellValue(row, columns.get("isbn"), formatter);
                }
                String productCode = cellValue(row, columns.get("productCode"), formatter);
                String saleProductId = cellValue(row, columns.get("saleProductId"), formatter);
                if (isbn.isBlank()) {
                    isbn = productCode;
                }
                String cover = cellValue(row, columns.get("cover"), formatter);
                String link = cellValue(row, columns.get("link"), formatter);

                if (cover.isBlank()) {
                    String coverCode = !productCode.isBlank() ? productCode : isbn;
                    if (!coverCode.isBlank()) {
                        cover = "https://contents.kyobobook.co.kr/sih/fit-in/300x0/filters:format(webp)/pdt/"
                                + coverCode + ".jpg";
                    }
                }
                if (link.isBlank() && !saleProductId.isBlank()) {
                    link = "https://product.kyobobook.co.kr/detail/" + saleProductId;
                }

                results.add(new BestsellerItemDTO(title, author, publisher, isbn, cover, link));
            }
            if (results.isEmpty()) {
                logger.warn("Kyobo excel parse returned no items");
            }
            return results;
        } catch (Exception e) {
            logger.warn("Kyobo excel parse failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private Map<String, Integer> mapKyoboExcelColumns(Row header, DataFormatter formatter) {
        Map<String, Integer> map = new HashMap<>();
        map.put("title", -1);
        map.put("author", -1);
        map.put("publisher", -1);
        map.put("isbn13", -1);
        map.put("isbn", -1);
        map.put("productCode", -1);
        map.put("saleProductId", -1);
        map.put("cover", -1);
        map.put("link", -1);

        if (header == null) {
            return map;
        }

        for (Cell cell : header) {
            String value = normalizeHeader(formatter.formatCellValue(cell));
            if (value.isEmpty()) continue;
            int idx = cell.getColumnIndex();

            if (value.contains("상품명")) {
                map.put("title", idx);
            } else if (value.contains("인물")) {
                map.put("author", idx);
            } else if (value.contains("출판사")) {
                map.put("publisher", idx);
            } else if (value.contains("isbn13")) {
                map.put("isbn13", idx);
            } else if (value.contains("isbn")) {
                map.put("isbn", idx);
            } else if (value.contains("상품코드")) {
                map.put("productCode", idx);
            } else if (value.contains("판매상품id")) {
                map.put("saleProductId", idx);
            } else if (value.contains("컴버") || value.contains("표지")) {
                map.put("cover", idx);
            } else if (value.contains("상품url") || value.contains("상품링크") || value.contains("링크")) {
                map.put("link", idx);
            }

        }
        if (map.get("productCode") == -1) {
            map.put("productCode", 1);
        }
        if (map.get("saleProductId") == -1) {
            map.put("saleProductId", 2);
        }
        if (map.get("author") == -1) {
            map.put("author", 9);
        }
        if (map.get("publisher") == -1) {
            map.put("publisher", 10);
        }
        if (map.get("title") == -1 && header != null) {
            map.put("title", 3);
        }
        return map;
    }

    private String normalizeHeader(String value) {
        if (value == null) return "";
        return value.replaceAll("\\s+", "").toLowerCase();
    }

    private String cellValue(Row row, Integer index, DataFormatter formatter) {
        if (index == null || index < 0) return "";
        Cell cell = row.getCell(index);
        return cell == null ? "" : formatter.formatCellValue(cell).trim();
    }

    private String[] splitMeta(String meta) {
        if (meta == null || meta.isBlank()) {
            return new String[] {"", ""};
        }
        String[] parts = meta.split("\\s*\\u00B7\\s*");
        String author = parts.length > 0 ? parts[0].trim() : "";
        String publisher = parts.length > 1 ? parts[1].trim() : "";
        return new String[] {author, publisher};
    }

    private void logKyoboDocDebug(Document doc, String tag) {
        if (doc == null) {
            logger.warn("Kyobo doc is null for {}", tag);
            return;
        }
        String body = doc.body() == null ? "" : doc.body().html();
        String snippet = body.length() > 800 ? body.substring(0, 800) : body;
        logger.info("Kyobo doc debug {} title='{}' snippet='{}'", tag, doc.title(), snippet.replaceAll("\\s+", " "));
    }

    private List<BestsellerItemDTO> scrapeKyoboLegacyTop10() {
        String url = "https://www.kyobobook.co.kr/bestSellerNew/bestseller.laf?orderClick=GJb";
        try {
            Document doc = fetchDocumentWithRetries(url, "https://www.kyobobook.co.kr", KYOBO_TIMEOUT_MS);
            Elements items = doc.select(".list_detail, .detail, li, .book_list li");
            if (items.isEmpty()) {
                return Collections.emptyList();
            }

            List<BestsellerItemDTO> results = new ArrayList<>();
            List<String> seenTitles = new ArrayList<>();
            for (Element item : items) {
                if (results.size() >= 10) break;

                String title = textOf(item.selectFirst("a.title, .title a, .detail .title a, .prod_name, .prod_name a"));
                if (title.isBlank()) continue;
                if (seenTitles.contains(title)) continue;
                seenTitles.add(title);

                String author = textOf(item.selectFirst(".author, .detail .author, .info .author"));
                String publisher = textOf(item.selectFirst(".publisher, .detail .publisher, .info .publisher"));

                Element coverEl = item.selectFirst(".cover img, .book_img img, img");
                String cover = attrOf(coverEl, "data-src");
                if (cover.isBlank()) {
                    cover = attrOf(coverEl, "src");
                }
                cover = normalizeUrl(cover);

                String link = attrOf(item.selectFirst("a.title, .title a, .prod_name a"), "href");
                link = normalizeUrl(link);

                results.add(new BestsellerItemDTO(title, author, publisher, "", cover, link));
            }
            if (results.isEmpty()) {
                logger.warn("Kyobo legacy scrape returned no items");
            }
            return results;
        } catch (Exception e) {
            logger.error("Kyobo legacy scrape failed: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    // 재시도 포함 HTML 요청
    private Document fetchDocumentWithRetries(String url, String referrer, int timeoutMs) throws Exception {
        Exception lastException = null;
        for (int attempt = 1; attempt <= KYOBO_RETRY_COUNT; attempt++) {
            try {
                return Jsoup.connect(url)
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                        .referrer(referrer)
                        .timeout(timeoutMs)
                        .header("Accept-Language", "ko-KR,ko;q=0.9,en;q=0.8")
                        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                        .get();
            } catch (Exception e) {
                lastException = e;
                logger.warn("Kyobo request attempt {}/{} failed: {}", attempt, KYOBO_RETRY_COUNT, e.getMessage());
                if (attempt < KYOBO_RETRY_COUNT) {
                    try {
                        Thread.sleep(KYOBO_RETRY_DELAY_MS);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
        Document fallback = fetchDocumentWithCurl(url, timeoutMs);
        if (fallback != null) {
            return fallback;
        }
        throw lastException;
    }

    private Document fetchDocumentWithCurl(String url, int timeoutMs) {
        try {
            ProcessBuilder builder = new ProcessBuilder(
                    "curl.exe",
                    "-L",
                    "--max-time",
                    String.valueOf(Math.max(1, timeoutMs / 1000)),
                    "-A",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    url
            );
            builder.redirectErrorStream(true);
            Process process = builder.start();
            String body = new String(process.getInputStream().readAllBytes());
            int exitCode = process.waitFor();
            if (exitCode != 0 || body == null || body.isBlank()) {
                logger.warn("curl.exe fallback failed with exitCode={}", exitCode);
                return null;
            }
            return Jsoup.parse(body, url);
        } catch (Exception e) {
            logger.warn("curl.exe fallback failed: {}", e.getMessage());
            return null;
        }
    }

    private String textOf(Element element) {
        return element == null ? "" : element.text().trim();
    }

    private String attrOf(Element element, String attr) {
        return element == null ? "" : element.attr(attr).trim();
    }

    private String normalizeUrl(String url) {
        if (url == null) return "";
        String trimmed = url.trim();
        if (trimmed.startsWith("//")) {
            return "https:" + trimmed;
        }
        return trimmed;
    }

    // 교보 DOM 파싱 결과 추출
    private List<BestsellerItemDTO> extractKyoboItems(Document doc) {
        Elements items = doc.select("li.prod_item, .prod_list .prod_item, .prod_list_type .prod_item");
        if (items.isEmpty()) {
            return Collections.emptyList();
        }

        List<BestsellerItemDTO> results = new ArrayList<>();
        List<String> seenTitles = new ArrayList<>();
        for (Element item : items) {
            if (results.size() >= 10) break;

            String title = textOf(item.selectFirst(".prod_info .prod_name"));
            if (title.isBlank()) {
                title = textOf(item.selectFirst("a.prod_info, .prod_name"));
            }
            if (title.isBlank()) continue;
            if (seenTitles.contains(title)) continue;
            seenTitles.add(title);

            String author = textOf(item.selectFirst(".prod_author"));
            String publisher = textOf(item.selectFirst(".prod_publish"));

            Element coverEl = item.selectFirst(".prod_thumb_box img, .prod_thumb img, img");
            String cover = attrOf(coverEl, "data-src");
            if (cover.isBlank()) {
                cover = attrOf(coverEl, "data-original");
            }
            if (cover.isBlank()) {
                cover = attrOf(coverEl, "src");
            }
            cover = normalizeUrl(cover);

            String link = attrOf(item.selectFirst("a.prod_info, .prod_name a"), "href");
            link = normalizeUrl(link);

            results.add(new BestsellerItemDTO(title, author, publisher, "", cover, link));
        }
        return results;
    }

    private interface Fetcher {
        List<BestsellerItemDTO> fetch();
    }
}
