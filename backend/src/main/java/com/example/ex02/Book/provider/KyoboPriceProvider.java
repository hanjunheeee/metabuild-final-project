package com.example.ex02.Book.service.provider;

import com.example.ex02.Book.dto.BookPriceDTO;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

@Component
public class KyoboPriceProvider implements BookPriceProvider {

    @Override
    public BookPriceDTO getPrice(String isbn, String title) {
        try {
            String query = (isbn != null && !isbn.isBlank()) ? isbn : title;
            String url = "https://search.kyobobook.co.kr/search?keyword=" + query;

            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0")
                    .timeout(5000)
                    .get();

            Element priceEl = doc.selectFirst(".prod_price .price");
            Element linkEl  = doc.selectFirst(".prod_info .prod_name");

            if (priceEl == null || linkEl == null) return null;

            int price = Integer.parseInt(
                    priceEl.text().replaceAll("[^0-9]", "")
            );

            String link = linkEl.absUrl("href");

            return new BookPriceDTO("교보문고", price, link);

        } catch (Exception e) {
            return null;
        }
    }
}
