const BASE_URL = 'http://localhost:7878'

/**
 * 검색 로그 저장
 * @param {string} keyword - 검색어
 * @param {string} bookTitle - 책 제목 (ISBN 검색 시 변환용)
 */
// 검색 로그 저장(ISBN 검색 시 도서명 전달)
export const logSearch = async (keyword, bookTitle = null) => {
  try {
    await fetch(`${BASE_URL}/api/analytics/log/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, bookTitle })
    })
  } catch (e) {
    // 로깅 실패는 무시 (사용자 경험에 영향 없음)
    console.warn('Search log failed:', e)
  }
}

/**
 * 책 액션 로그 저장
 * @param {number} bookId - 책 ID
 * @param {'PURCHASE_VIEW'|'LIBRARY_SEARCH'|'AI_SUMMARY'} actionType - 액션 타입
 */
// 도서 액션 로그(구매/대출/요약)
export const logBookAction = async (bookId, actionType) => {
  try {
    await fetch(`${BASE_URL}/api/analytics/log/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, actionType })
    })
  } catch (e) {
    console.warn('Action log failed:', e)
  }
}

/**
 * 인기 검색어 트렌드 조회 (워드클라우드용)
 */
// 검색어 트렌드 조회
export const fetchKeywordTrends = async () => {
  const res = await fetch(`${BASE_URL}/api/analytics/trends/keywords`)
  return res.json()
}

/**
 * 구매 인기 도서 트렌드 조회
 */
// 구매 트렌드 조회
export const fetchPurchaseTrends = async () => {
  const res = await fetch(`${BASE_URL}/api/analytics/trends/purchase`)
  return res.json()
}

/**
 * 대출 인기 도서 트렌드 조회
 */
// 대출 트렌드 조회
export const fetchLibraryTrends = async () => {
  const res = await fetch(`${BASE_URL}/api/analytics/trends/library`)
  return res.json()
}
