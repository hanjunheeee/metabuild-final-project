const BASE_URL = ''

export const fetchGuList = async () => {
  const response = await fetch(`${BASE_URL}/api/library/gu-list`)
  if (!response.ok) throw new Error('구 리스트 조회 실패')
  return response.json()
}

export const fetchLibraryData = async () => {
  const response = await fetch(`${BASE_URL}/api/library/data`)
  if (!response.ok) throw new Error('도서관 데이터 조회 실패')
  return response.json()
}

export const searchBooks = async (query) => {
  const response = await fetch(`${BASE_URL}/api/library/search-book?query=${encodeURIComponent(query)}`)
  if (!response.ok) throw new Error('도서 검색 실패')
  return response.json()
}

export const checkLoan = async (libCode, isbn) => {
  const response = await fetch(`${BASE_URL}/api/library/check-loan?libCode=${libCode}&isbn=${isbn}`)
  if (!response.ok) throw new Error('대출 확인 실패')
  return response.json()
}
