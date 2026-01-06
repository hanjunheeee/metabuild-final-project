const BASE_URL = 'http://localhost:7878'

// 구 리스트 조회
export const fetchGuList = async () => {
  const response = await fetch(`${BASE_URL}/api/library/gu-list`)
  if (!response.ok) throw new Error('구 리스트 조회 실패')
  return response.json()
}

// 도서관 전체 데이터 조회
export const fetchLibraryData = async () => {
  const response = await fetch(`${BASE_URL}/api/library/data`)
  if (!response.ok) throw new Error('도서관 데이터 조회 실패')
  return response.json()
}

// 도서 검색
export const searchBooks = async (query) => {
  const response = await fetch(`${BASE_URL}/api/library/search-book?query=${encodeURIComponent(query)}`)
  if (!response.ok) throw new Error('도서 검색 실패')
  return response.json()
}

// 대출 가능 여부 확인
export const checkLoan = async (libCode, isbn) => {
  const response = await fetch(`${BASE_URL}/api/library/check-loan?libCode=${libCode}&isbn=${isbn}`)
  if (!response.ok) throw new Error('대출 확인 실패')
  return response.json()
}

