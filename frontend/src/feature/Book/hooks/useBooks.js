import { useState, useEffect } from 'react'
import { fetchBooks } from '../api/bookApi'

// 검색어에 따른 도서 목록 로딩 훅
function useBooks(query = '') {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 검색어 변경 시 목록 재조회
  useEffect(() => {
    setLoading(true)
    fetchBooks(query)
      .then(data => {
        setBooks(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error:', err)
        setError(err)
        setLoading(false)
      })
  }, [query])

  return { books, loading, error }
}

export default useBooks
