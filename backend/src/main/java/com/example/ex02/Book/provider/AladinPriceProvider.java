package com.example.ex02.Book.service.provider;

import com.example.ex02.Book.dto.BookPriceDTO;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

@Component
public class AladinPriceProvider implements BookPriceProvider {

    @Override
    public BookPriceDTO getPrice(String isbn, String title) {
        try {
            String query = (isbn != null && !isbn.isBlank()) ? isbn : title;
            String url = "https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Book&SearchWord=" + query;

            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0")
                    .timeout(5000)
                    .get();

            Element priceEl = doc.selectFirst(".ss_book_list .ss_p2 b");
            Element linkEl  = doc.selectFirst(".ss_book_list .bo3");

            if (priceEl == null || linkEl == null) return null;

            int price = Integer.parseInt(
                    priceEl.text().replaceAll("[^0-9]", "")
            );

            String link = linkEl.absUrl("href");

            return new BookPriceDTO("알라딘", price, link);

        } catch (Exception e) {
            return null;
        }
    }
}
