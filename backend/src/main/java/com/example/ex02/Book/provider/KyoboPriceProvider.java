package com.example.ex02.Book.provider;

import com.example.ex02.Book.dto.BookPriceDTO;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class KyoboPriceProvider implements BookPriceProvider {

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
                    "https://search.kyobobook.co.kr/search?keyword=" +
                            URLEncoder.encode(query, StandardCharsets.UTF_8);

            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0")
                    .timeout(5000)
                    .get();

            Element priceEl = doc.selectFirst(".prod_price .price .val, .prod_price .price .priceVal");
            Element linkEl  = doc.selectFirst(".prod_name_group .prod_info");

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
                    "KYOBO",
                    price,
                    link
            );

        } catch (Exception e) {
            // 필요하면 여기서 로그
            return null;
        }
    }
}
