package com.example.ex02.Book.provider;

import com.example.ex02.Book.dto.BookPriceDTO;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class Yes24PriceProvider implements BookPriceProvider {

    @Override
    public BookPriceDTO getPrice(String isbn, String title) {
        // ISBN으로 먼저 검색, 실패 시 title로 재검색
        BookPriceDTO result = fetchByQuery(isbn);
        if (result == null) {
            result = fetchByQuery(title);
        }
        return result;
    }

    private BookPriceDTO fetchByQuery(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }

        try {
            String url = "https://www.yes24.com/Product/Search?domain=BOOK&query=" 
                    + URLEncoder.encode(query, StandardCharsets.UTF_8);

            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(5000)
                    .get();

            // YES24 검색결과 페이지의 가격 셀렉터들 (여러 가지 시도)
            Element priceEl = doc.selectFirst(".info_row.info_price .yes_b");
            if (priceEl == null) {
                priceEl = doc.selectFirst(".nor_price .yes_b");
            }
            if (priceEl == null) {
                priceEl = doc.selectFirst(".price .yes_b");
            }
            if (priceEl == null) {
                priceEl = doc.selectFirst(".s_price em");
            }

            // 상품 링크 셀렉터
            Element linkEl = doc.selectFirst(".gd_name");
            if (linkEl == null) {
                linkEl = doc.selectFirst(".goods_name a");
            }
            if (linkEl == null) {
                linkEl = doc.selectFirst("a.gd_name");
            }

            if (priceEl == null || linkEl == null) {
                return null;
            }

            String priceText = priceEl.text().replaceAll("[^0-9]", "");
            if (priceText.isBlank()) {
                return null;
            }

            int price = Integer.parseInt(priceText);

            String link = linkEl.absUrl("href");
            if (link.isBlank()) {
                link = "https://www.yes24.com" + linkEl.attr("href");
            }

            return new BookPriceDTO("YES24", price, link);

        } catch (Exception e) {
            // 디버깅용 로그 (필요시 활성화)
            // e.printStackTrace();
            return null;
        }
    }
}
