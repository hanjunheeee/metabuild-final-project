package com.example.ex02.Analytics.service;

import com.example.ex02.Analytics.dto.SearchTrendDTO;
import com.example.ex02.Analytics.entity.BookSearchLogEntity;
import com.example.ex02.Analytics.entity.BookSearchLogEntity.ActionType;
import com.example.ex02.Analytics.repository.BookSearchLogRepository;
import com.example.ex02.Book.entity.BookEntity;
import com.example.ex02.Book.repository.BookRepository;
import com.example.ex02.User.entity.UserEntity;
import com.example.ex02.User.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchTrendService {

    private final BookSearchLogRepository searchLogRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    // 캐시된 트렌드 데이터
    private List<SearchTrendDTO> cachedKeywordTrends = new ArrayList<>();
    private List<SearchTrendDTO> cachedPurchaseTrends = new ArrayList<>();
    private List<SearchTrendDTO> cachedLibraryTrends = new ArrayList<>();
    private LocalDateTime lastCacheUpdate;

    private static final int RETENTION_DAYS = 7;      // 로그 보관 기간
    private static final int TREND_LIMIT = 50;        // 트렌드 조회 개수
    private static final int CACHE_MINUTES = 5;       // 캐시 갱신 주기

    // ========================================
    // 검색 로그 저장
    // ========================================

    /**
     * 검색어 로그 저장 (ISBN인 경우 책 제목으로 변환)
     */
    @Transactional
    public void logSearch(String keyword, Long userId, String bookTitle) {
        String logKeyword = keyword;

        // ISBN 패턴인 경우 책 제목으로 변환
        if (isIsbn(keyword) && bookTitle != null && !bookTitle.isEmpty()) {
            logKeyword = bookTitle;
        }

        // 너무 짧은 검색어 필터링
        if (logKeyword == null || logKeyword.trim().length() < 2) {
            return;
        }

        UserEntity user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        BookSearchLogEntity logEntity = BookSearchLogEntity.builder()
                .keyword(logKeyword.trim())
                .actionType(ActionType.SEARCH)
                .user(user)
                .build();

        searchLogRepository.save(logEntity);
    }

    /**
     * 책 클릭 액션 로그 저장 (구매조회, 도서관검색, AI요약)
     */
    @Transactional
    public void logBookAction(Long bookId, Long userId, ActionType actionType) {
        if (bookId == null || actionType == ActionType.SEARCH) {
            return;
        }

        BookEntity book = bookRepository.findById(bookId).orElse(null);
        if (book == null) {
            return;
        }

        UserEntity user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        BookSearchLogEntity logEntity = BookSearchLogEntity.builder()
                .book(book)
                .actionType(actionType)
                .user(user)
                .build();

        searchLogRepository.save(logEntity);
    }

    // ========================================
    // 트렌드 조회
    // ========================================

    /**
     * 인기 검색어 조회 (워드클라우드용)
     */
    public List<SearchTrendDTO> getKeywordTrends() {
        refreshCacheIfNeeded();
        return cachedKeywordTrends;
    }

    /**
     * 구매 인기 도서 조회
     */
    public List<SearchTrendDTO> getPurchaseTrends() {
        refreshCacheIfNeeded();
        return cachedPurchaseTrends;
    }

    /**
     * 대출 인기 도서 조회
     */
    public List<SearchTrendDTO> getLibraryTrends() {
        refreshCacheIfNeeded();
        return cachedLibraryTrends;
    }

    // ========================================
    // 캐시 갱신
    // ========================================

    private void refreshCacheIfNeeded() {
        if (lastCacheUpdate == null || 
            lastCacheUpdate.plusMinutes(CACHE_MINUTES).isBefore(LocalDateTime.now())) {
            refreshCache();
        }
    }

    private synchronized void refreshCache() {
        LocalDateTime since = LocalDateTime.now().minusDays(RETENTION_DAYS);

        // 인기 검색어
        List<Object[]> keywordResults = searchLogRepository.findTopKeywords(since);
        cachedKeywordTrends = keywordResults.stream()
                .limit(TREND_LIMIT)
                .map(row -> new SearchTrendDTO((String) row[0], (Long) row[1]))
                .collect(Collectors.toList());

        // 구매 인기 도서
        List<Object[]> purchaseResults = searchLogRepository.findTopBooksByAction(
                ActionType.PURCHASE_VIEW, since);
        cachedPurchaseTrends = purchaseResults.stream()
                .limit(TREND_LIMIT)
                .map(row -> new SearchTrendDTO(
                        (Long) row[0],      // bookId
                        (String) row[1],    // title
                        (String) row[2],    // author
                        (String) row[3],    // imageUrl
                        (Long) row[4]       // count
                ))
                .collect(Collectors.toList());

        // 대출 인기 도서
        List<Object[]> libraryResults = searchLogRepository.findTopBooksByAction(
                ActionType.LIBRARY_SEARCH, since);
        cachedLibraryTrends = libraryResults.stream()
                .limit(TREND_LIMIT)
                .map(row -> new SearchTrendDTO(
                        (Long) row[0],
                        (String) row[1],
                        (String) row[2],
                        (String) row[3],
                        (Long) row[4]
                ))
                .collect(Collectors.toList());

        lastCacheUpdate = LocalDateTime.now();
        log.info("트렌드 캐시 갱신 완료: 검색어 {}개, 구매 {}개, 대출 {}개",
                cachedKeywordTrends.size(),
                cachedPurchaseTrends.size(),
                cachedLibraryTrends.size());
    }

    // ========================================
    // 스케줄러: 오래된 로그 자동 삭제
    // ========================================

    /**
     * 매일 새벽 3시에 7일 이전 로그 삭제
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupOldLogs() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(RETENTION_DAYS);
        int deletedCount = searchLogRepository.deleteByCreatedAtBefore(threshold);
        log.info("오래된 검색 로그 {}건 삭제 완료 ({}일 이전)", deletedCount, RETENTION_DAYS);
    }

    /**
     * 5분마다 캐시 갱신
     */
    @Scheduled(fixedRate = 300000)
    public void scheduledCacheRefresh() {
        refreshCache();
    }

    // ========================================
    // 유틸 메서드
    // ========================================

    /**
     * ISBN 패턴 체크 (숫자만 10~13자리)
     */
    private boolean isIsbn(String keyword) {
        if (keyword == null) return false;
        String cleaned = keyword.replaceAll("-", "");
        return cleaned.matches("^[0-9]{10,13}$");
    }
}

