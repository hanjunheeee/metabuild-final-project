package com.example.ex02.Book.provider;

import com.example.ex02.Book.dto.BookPriceDTO;

// 판매처 가격 조회 인터페이스
public interface BookPriceProvider {
    // ISBN/제목 기반 가격 조회
    BookPriceDTO getPrice(String isbn, String title);
}
