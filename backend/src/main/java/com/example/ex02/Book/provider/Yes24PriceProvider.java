package com.example.ex02.Book.provider;

import com.example.ex02.Book.dto.BookPriceDTO;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

@Component
public class Yes24PriceProvider implements BookPriceProvider {

    @Override
    public BookPriceDTO getPrice(String isbn, String title) {
        try {
            String query = (isbn != null && !isbn.isBlank()) ? isbn : title;
            String url = "https://www.yes24.com/Product/Search?domain=BOOK&query=" + query;

            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0")
                    .timeout(5000)
                    .get();

            Element priceEl = doc.selectFirst(".info_row.info_price .txt_num .yes_b");
            Element linkEl  = doc.selectFirst(".gd_name");

            if (priceEl == null || linkEl == null) return null;

            int price = Integer.parseInt(
                    priceEl.text().replaceAll("[^0-9]", "")
            );

            String link = linkEl.absUrl("href");
            if (link.isBlank()) {
                link = "https://www.yes24.com" + linkEl.attr("href");
            }

            return new BookPriceDTO("YES24", price, link);

        } catch (Exception e) {
            return null;
        }
    }
}
