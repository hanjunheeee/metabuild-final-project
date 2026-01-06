package com.example.ex02.Book.dto;

public class BookSummaryResponse {

    private Long bookId;
    private String title;
    private String summary;

    public BookSummaryResponse(Long bookId, String title, String summary) {
        this.bookId = bookId;
        this.title = title;
        this.summary = summary;
    }

    public Long getBookId() {
        return bookId;
    }

    public String getTitle() {
        return title;
    }

    public String getSummary() {
        return summary;
    }
}
