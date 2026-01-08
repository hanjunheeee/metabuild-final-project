import { useState, useEffect } from 'react'
import { fetchBooks } from '../api/bookApi'

function useBooks(query = '') {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
