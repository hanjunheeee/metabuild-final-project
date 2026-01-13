package com.example.ex02.Book.dto;

// 판매처 가격 DTO
public class BookPriceDTO {

    private String provider;
    private Integer price;
    private String link;

    public BookPriceDTO() {
    }

    public BookPriceDTO(String provider, Integer price, String link) {
        this.provider = provider;
        this.price = price;
        this.link = link;
    }

    public String getProvider() {
        return provider;
    }

    public Integer getPrice() {
        return price;
    }

    public String getLink() {
        return link;
    }
}
