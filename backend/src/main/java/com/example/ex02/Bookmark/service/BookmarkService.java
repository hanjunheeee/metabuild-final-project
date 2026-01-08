package com.example.ex02.Bookmark.service;

import com.example.ex02.Book.entity.BookEntity;
import com.example.ex02.Book.repository.BookRepository;
import com.example.ex02.Bookmark.dto.BookmarkDTO;
import com.example.ex02.Bookmark.entity.BookmarkEntity;
import com.example.ex02.Bookmark.repository.BookmarkRepository;
import com.example.ex02.User.entity.UserEntity;
import com.example.ex02.User.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    /**
     * 북마크 토글 (추가/삭제)
     */
    @Transactional
    public Map<String, Object> toggleBookmark(Long userId, Long bookId) {
        Map<String, Object> result = new HashMap<>();
        
        var existingBookmark = bookmarkRepository.findByUser_UserIdAndBook_BookId(userId, bookId);
        
        if (existingBookmark.isPresent()) {
            // 이미 북마크되어 있으면 삭제
            bookmarkRepository.delete(existingBookmark.get());
            result.put("success", true);
            result.put("bookmarked", false);
            result.put("message", "북마크가 해제되었습니다.");
        } else {
            // 북마크 추가
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
            BookEntity book = bookRepository.findById(bookId)
                    .orElseThrow(() -> new RuntimeException("책을 찾을 수 없습니다."));
            
            BookmarkEntity bookmark = new BookmarkEntity();
            bookmark.setUser(user);
            bookmark.setBook(book);
            bookmarkRepository.save(bookmark);
            
            result.put("success", true);
            result.put("bookmarked", true);
            result.put("message", "북마크에 추가되었습니다.");
        }
        
        // 해당 책의 총 북마크 수 반환
        result.put("bookmarkCount", bookmarkRepository.countByBook_BookId(bookId));
        return result;
    }

    /**
     * 북마크 여부 확인
     */
    public Map<String, Object> checkBookmark(Long userId, Long bookId) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("bookmarked", bookmarkRepository.existsByUser_UserIdAndBook_BookId(userId, bookId));
        result.put("bookmarkCount", bookmarkRepository.countByBook_BookId(bookId));
        return result;
    }

    /**
     * 사용자의 북마크 목록 조회
     */
    public List<BookmarkDTO> getBookmarksByUserId(Long userId) {
        return bookmarkRepository.findByUser_UserIdOrderByFavoriteDateDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 사용자가 북마크한 책 ID 목록 조회
     */
    public List<Long> getBookmarkedBookIds(Long userId) {
        return bookmarkRepository.findByUser_UserIdOrderByFavoriteDateDesc(userId)
                .stream()
                .map(b -> b.getBook().getBookId())
                .collect(Collectors.toList());
    }

    private BookmarkDTO convertToDTO(BookmarkEntity entity) {
        BookmarkDTO dto = new BookmarkDTO();
        dto.setBookmarkId(entity.getBookmarkId());
        dto.setUserId(entity.getUser().getUserId());
        dto.setBookId(entity.getBook().getBookId());
        dto.setFavoriteDate(entity.getFavoriteDate());
        // 책 정보도 포함
        dto.setBookTitle(entity.getBook().getTitle());
        dto.setBookAuthor(entity.getBook().getAuthor());
        dto.setBookImageUrl(entity.getBook().getImageUrl());
        return dto;
    }
}
