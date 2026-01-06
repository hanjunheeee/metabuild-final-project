package com.example.ex02.Book.service;

import com.example.ex02.Book.dto.BookPriceDTO;
import com.example.ex02.Book.entity.BookEntity;
import com.example.ex02.Book.provider.BookPriceProvider;
import com.example.ex02.Book.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookPriceService {

    private final List<BookPriceProvider> providers;
    private final BookRepository bookRepository;

    @Transactional(readOnly = true)
    public List<BookPriceDTO> getPrices(Long bookId, String titleOverride) {
        BookEntity book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));

        String isbn = book.getIsbn();
        String title = (titleOverride != null && !titleOverride.isBlank())
                ? titleOverride
                : book.getTitle();

        List<BookPriceDTO> result = new ArrayList<>();

        for (BookPriceProvider provider : providers) {
            BookPriceDTO dto = provider.getPrice(isbn, title);
            if (dto != null) {
                result.add(dto);
            }
        }
        return result;
    }
}
