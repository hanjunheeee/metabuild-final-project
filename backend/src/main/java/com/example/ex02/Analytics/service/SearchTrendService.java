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

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashSet;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
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
    private static final String BLOCKED_KEYWORDS_RESOURCE = "blocked-keywords.sha256";
    private static final Set<String> DEFAULT_BLOCKED_KEYWORDS = Set.copyOf(Arrays.asList(
            "광고",
            "홍보",
            "협찬",
            "쿠폰",
            "할인코드",
            "이벤트",
            "무료",
            "바로가기",
            "링크",
            "클릭",
            "문의주세요",
            "카톡",
            "오픈카톡",
            "텔레그램",
            "구독",
            "팔로우",
            "좋아요",
            "카지노",
            "토토",
            "바카라",
            "성인",
            "야동"
    ));
    private static final Set<String> DEFAULT_BLOCKED_KEYWORD_HASHES = hashKeywordSet(DEFAULT_BLOCKED_KEYWORDS);
    private static final Set<String> BLOCKED_KEYWORDS = loadBlockedKeywords();

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
        logKeyword = normalizeKeyword(logKeyword);
        if (!isValidKeyword(logKeyword)) {
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
    
    private static Set<String> hashKeywordSet(Set<String> keywords) {
        return keywords.stream()
                .map(keyword -> hashKeyword(keyword.toLowerCase(Locale.ROOT)))
                .collect(Collectors.toSet());
    }

    private static String hashKeyword(String keyword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(keyword.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(hashed.length * 2);
            for (byte value : hashed) {
                builder.append(String.format("%02x", value));
            }
            return builder.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 hashing failed", e);
        }
    }

    private static Set<String> loadBlockedKeywords() {
        Set<String> loaded = new HashSet<>();
        try (InputStream in = SearchTrendService.class.getClassLoader()
                .getResourceAsStream(BLOCKED_KEYWORDS_RESOURCE)) {
            if (in != null) {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(in, StandardCharsets.UTF_8))) {
                    reader.lines()
                            .map(String::trim)
                            .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                            .map(line -> line.toLowerCase(Locale.ROOT))
                            .forEach(loaded::add);
                }
            }
        } catch (Exception e) {
            log.warn("Blocked keyword resource load failed: {}", e.getMessage());
        }

        if (loaded.isEmpty()) {
            return DEFAULT_BLOCKED_KEYWORD_HASHES;
        }
        loaded.addAll(DEFAULT_BLOCKED_KEYWORD_HASHES);
        return Set.copyOf(loaded);
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null) return "";
        String normalized = keyword.replaceAll("\\s+", " ").trim();
        normalized = normalized.replaceAll("^[\\p{Punct}\\s]+|[\\p{Punct}\\s]+$", "");
        return normalized.trim();
    }

    private boolean isValidKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) return false;
        if (keyword.matches("^\\d+$")) return false;

        String lower = keyword.toLowerCase(Locale.ROOT);
        String hashed = hashKeyword(lower);
        if (BLOCKED_KEYWORDS.contains(hashed)) return false;

        long koreanCount = keyword.chars().filter(ch -> ch >= 0xAC00 && ch <= 0xD7A3).count();
        long englishCount = keyword.chars().filter(ch -> (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')).count();
        long digitCount = keyword.chars().filter(Character::isDigit).count();
        long otherCount = keyword.length() - koreanCount - englishCount - digitCount;

        if (koreanCount > 0 && koreanCount < 2) return false;
        if (englishCount > 0 && koreanCount == 0 && otherCount == 0 && englishCount < 3) return false;

        return true;
    }

    private boolean isIsbn(String keyword) {
        if (keyword == null) return false;
        String cleaned = keyword.replaceAll("-", "");
        return cleaned.matches("^[0-9]{10,13}$");
    }
}

