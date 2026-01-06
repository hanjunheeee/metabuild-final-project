package com.example.ex02.Book.provider;

import com.example.ex02.Book.dto.BookPriceDTO;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class AladinPriceProvider implements BookPriceProvider {

    @Override
    public BookPriceDTO getPrice(String isbn, String title) {

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
            String url =
                    "https://www.aladin.co.kr/search/wsearchresult.aspx" +
                            "?SearchTarget=Book&SearchWord=" +
                            URLEncoder.encode(query, StandardCharsets.UTF_8);

            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0")
                    .timeout(5000)
                    .get();

            Element priceEl = doc.selectFirst(".ss_book_list .ss_p2 em, .ss_book_list .ss_p2 b");
            Element linkEl  = doc.selectFirst(".ss_book_list .bo3");

            if (priceEl == null || linkEl == null) {
                return null;
            }

            String priceText = priceEl.text().replaceAll("[^0-9]", "");
            if (priceText.isBlank()) {
                return null;
            }

            int price = Integer.parseInt(
                    priceText
            );

            String link = linkEl.absUrl("href");

            return new BookPriceDTO(
                    "ALADIN",
                    price,
                    link
            );

        } catch (Exception e) {
            // 여기서 로그 찍어도 좋다
            return null;
        }
    }
}
