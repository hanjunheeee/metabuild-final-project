const BASE_URL = 'http://localhost:7878'

// 전체 도서 조회
export const fetchBooks = () => {
  return fetch(`${BASE_URL}/api/books`).then(res => res.json())
}

// 도서 ID로 조회
export const fetchBookById = (id) => {
  return fetch(`${BASE_URL}/api/books/${id}`).then(res => res.json())
}

// 도서 구매처/가격 조회
export const fetchBookShops = (bookId, title) => {
  const query = title ? `?title=${encodeURIComponent(title)}` : ''
  return fetch(`${BASE_URL}/api/books/${bookId}/shops${query}`).then(res => {
    if (!res.ok) {
      throw new Error('가격 조회 실패')
    }
    return res.json()
  })
}

