const BASE_URL = 'http://localhost:7878'

const getAuthHeader = () => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

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
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(bookData)
  })
  if (!res.ok) {
    const errorBody = await res.text()
    console.error('Create book error - Status:', res.status, 'Body:', errorBody)
    
    // 권한 에러 (403)
    if (res.status === 403) {
      throw new Error('AUTH_ERROR')
    }
    
    // ISBN 중복 에러 체크 (Oracle: ORA-00001, 무결성 제약)
    if (errorBody.includes('ORA-00001') || errorBody.includes('무결성 제약') || errorBody.includes('unique') || errorBody.includes('duplicate')) {
      throw new Error('ISBN_DUPLICATE')
    }
    
    throw new Error(`도서 등록에 실패했습니다. (상태: ${res.status})`)
  }
  return res.json()
}

// 도서 수정
export const updateBook = async (bookId, bookData) => {
  const res = await fetch(`${BASE_URL}/api/books/${bookId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(bookData)
  })
  if (!res.ok) throw new Error('Failed to update book')
  return res.json()
}

// 도서 삭제
export const deleteBook = async (bookId) => {
  const res = await fetch(`${BASE_URL}/api/books/${bookId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader()
    }
  })
  if (!res.ok) throw new Error('Failed to delete book')
  return true
}

