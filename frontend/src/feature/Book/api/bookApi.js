const BASE_URL = 'http://localhost:7878'

// 도서 목록 조회(검색어 선택)
export const fetchBooks = (query = '') => {
  const trimmed = query.trim()
  const url = trimmed
    ? `${BASE_URL}/api/books?query=${encodeURIComponent(trimmed)}`
    : `${BASE_URL}/api/books`
  return fetch(url).then(res => res.json())
}

// 도서 검색 (검색어 필수, 최소 2글자)
export const searchBooks = (query) => {
  const trimmed = (query || '').trim()
  if (trimmed.length < 2) {
    return Promise.resolve([])
  }
  return fetch(`${BASE_URL}/api/books?query=${encodeURIComponent(trimmed)}`).then(res => res.json())
}

// 도서 상세 조회
export const fetchBookById = (id) => {
  return fetch(`${BASE_URL}/api/books/${id}`).then(res => res.json())
}

// 판매처 가격 조회
export const fetchBookShops = (bookId, title) => {
  const query = title ? `?title=${encodeURIComponent(title)}` : ''
  return fetch(`${BASE_URL}/api/books/${bookId}/shops${query}`).then(res => {
    if (!res.ok) {
      throw new Error('Failed to fetch shop data')
    }
    return res.json()
  })
}

// AI 요약 조회
export const fetchBookSummary = (bookId) => {
  return fetch(`${BASE_URL}/api/books/${bookId}/summary`).then(res => {
    if (!res.ok) {
      throw new Error('Failed to fetch summary')
    }
    return res.json()
  })
}

// 알라딘 베스트셀러 TOP10
export const fetchAladinBestsellers = () => {
  return fetch(`${BASE_URL}/api/books/bestsellers/aladin`).then(res => {
    if (!res.ok) {
      throw new Error('Failed to fetch Aladin bestsellers')
    }
    return res.json()
  })
}

// 교보 베스트셀러 TOP10(스크래핑)
export const fetchKyoboBestsellers = () => {
  return fetch(`${BASE_URL}/api/books/bestsellers/kyobo`).then(res => {
    if (!res.ok) {
      throw new Error('Failed to fetch Kyobo bestsellers')
    }
    return res.json()
  })
}

// YES24 베스트셀러 TOP10(스크래핑)
export const fetchYes24Bestsellers = () => {
  return fetch(`${BASE_URL}/api/books/bestsellers/yes24`).then(res => {
    if (!res.ok) {
      throw new Error('Failed to fetch YES24 bestsellers')
    }
    return res.json()
  })
}

// 서울 대출 TOP10
export const fetchSeoulLoanTop10 = () => {
  return fetch(`${BASE_URL}/api/books/loans/seoul`).then(res => {
    if (!res.ok) {
      throw new Error('Failed to fetch Seoul loan ranking')
    }
    return res.json()
  })
}
