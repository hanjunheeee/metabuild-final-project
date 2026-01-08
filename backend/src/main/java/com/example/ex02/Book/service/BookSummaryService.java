package com.example.ex02.Book.service;

import com.example.ex02.Book.dto.BookDTO;
import com.example.ex02.Book.dto.BookSummaryResponse;
import com.example.ex02.Book.external.Data4LibraryBookInfo;
import com.example.ex02.Book.external.Data4LibraryClient;
import com.example.ex02.Book.llm.LlmSummaryClient;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookSummaryService {

    private static final Logger logger = LoggerFactory.getLogger(BookSummaryService.class);

    private static final String FALLBACK_SUMMARY =
            "요약 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";

    private final BookService bookService;
    private final LlmSummaryClient llmSummaryClient;
    private final Data4LibraryClient data4LibraryClient;

    public BookSummaryResponse getSummary(Long bookId) {

        BookDTO book = bookService.getBookById(bookId);
        Data4LibraryBookInfo info = data4LibraryClient.fetchByIsbn13(book.getIsbn());

        String prompt = buildPrompt(book, info);
        logger.info("Summary prompt built for bookId={} (isbn={})", bookId, book.getIsbn());
        String summary = llmSummaryClient.summarize(prompt);

        if (summary == null || summary.isBlank()) {
            logger.warn("Summary fallback used for bookId={}", bookId);
            summary = FALLBACK_SUMMARY;
        }

        return new BookSummaryResponse(
                bookId,
                book.getTitle(),
                summary
        );
    }

    private String buildPrompt(BookDTO book, Data4LibraryBookInfo info) {
        String title = info != null && !isBlank(info.getTitle())
                ? info.getTitle()
                : book.getTitle();
        String authors = info != null && !isBlank(info.getAuthors())
                ? info.getAuthors()
                : book.getAuthor();
        String publisher = info != null && !isBlank(info.getPublisher())
                ? info.getPublisher()
                : book.getPublisher();
        String publicationYear = info != null ? info.getPublicationYear() : null;
        String description = info != null && !isBlank(info.getDescription())
                ? info.getDescription()
                : book.getSummary();

        StringBuilder sb = new StringBuilder();
        sb.append("아래는 한 권의 책에 대한 소개 자료다.\n");
        sb.append("이 책을 아직 읽지 않은 이용자가\n");
        sb.append("'이 책을 꼭 읽어보고 싶다'고 느끼도록\n");
        sb.append("흥미롭고 감정이 살아 있는 줄거리 요약을 작성해라.\n\n");
        sb.append("조건:\n");
        sb.append("- 반드시 4~6문장\n");
        sb.append("- 스포일러 금지\n");
        sb.append("- 평서문 위주\n");
        sb.append("- 광고 문구처럼 과장하지 말 것\n");
        sb.append("- 독자가 책을 통해 얻을 수 있는 변화나 통찰을 강조할 것\n\n");
        sb.append("제목: ").append(nullToEmpty(title)).append('\n');
        sb.append("저자: ").append(nullToEmpty(authors)).append('\n');
        sb.append("출판사: ").append(nullToEmpty(publisher)).append('\n');
        if (!isBlank(publicationYear)) {
            sb.append("출판연도: ").append(publicationYear).append('\n');
        }
        if (!isBlank(description)) {
            sb.append("책 소개: ").append(description).append('\n');
        }
        return sb.toString();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
