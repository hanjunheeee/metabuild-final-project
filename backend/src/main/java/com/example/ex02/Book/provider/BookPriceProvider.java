package com.example.ex02.Book.service.provider;

import com.example.ex02.Book.dto.BookPriceDTO;

public interface BookPriceProvider {
    BookPriceDTO getPrice(String isbn, String title);
}
