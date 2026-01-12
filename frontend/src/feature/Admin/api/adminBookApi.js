const BASE_URL = 'http://localhost:7878'

// 도서 목록 조회 (검색 포함)
export const fetchBooks = async (query = '') => {
  const url = query
    ? `${BASE_URL}/api/books?query=${encodeURIComponent(query)}`
    : `${BASE_URL}/api/books`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch books')
  return res.json()
}

// 도서 생성
export const createBook = async (bookData) => {
  const res = await fetch(`${BASE_URL}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookData)
  })
  if (!res.ok) throw new Error('Failed to create book')
  return res.json()
}

// 도서 수정
export const updateBook = async (bookId, bookData) => {
  const res = await fetch(`${BASE_URL}/api/books/${bookId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookData)
  })
  if (!res.ok) throw new Error('Failed to update book')
  return res.json()
}

// 도서 삭제
export const deleteBook = async (bookId) => {
  const res = await fetch(`${BASE_URL}/api/books/${bookId}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete book')
  return true
}

