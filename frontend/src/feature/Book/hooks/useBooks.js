import { useState, useEffect } from 'react'
import { fetchBooks } from '../api/bookApi'

function useBooks() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchBooks()
      .then(data => {
        setBooks(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error:', err)
        setError(err)
        setLoading(false)
      })
  }, [])

  return { books, loading, error }
}

export default useBooks
