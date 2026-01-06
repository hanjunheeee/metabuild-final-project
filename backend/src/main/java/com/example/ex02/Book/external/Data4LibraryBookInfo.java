package com.example.ex02.Book.external;

public class Data4LibraryBookInfo {

    private final String title;
    private final String authors;
    private final String publisher;
    private final String publicationYear;
    private final String description;

    public Data4LibraryBookInfo(
            String title,
            String authors,
            String publisher,
            String publicationYear,
            String description
    ) {
        this.title = title;
        this.authors = authors;
        this.publisher = publisher;
        this.publicationYear = publicationYear;
        this.description = description;
    }

    public String getTitle() {
        return title;
    }

    public String getAuthors() {
        return authors;
    }

    public String getPublisher() {
        return publisher;
    }

    public String getPublicationYear() {
        return publicationYear;
    }

    public String getDescription() {
        return description;
    }
}
