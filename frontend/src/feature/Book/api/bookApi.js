const BASE_URL = 'http://localhost:7878'

// Fetch all books
export const fetchBooks = () => {
  return fetch(`${BASE_URL}/api/books`).then(res => res.json())
}

// Fetch a book by id
export const fetchBookById = (id) => {
  return fetch(`${BASE_URL}/api/books/${id}`).then(res => res.json())
}

// Fetch book shops and prices
export const fetchBookShops = (bookId, title) => {
  const query = title ? `?title=${encodeURIComponent(title)}` : ''
  return fetch(`${BASE_URL}/api/books/${bookId}/shops${query}`).then(res => {
    if (!res.ok) {
      throw new Error('Failed to fetch shop data')
    }
    return res.json()
  })
}

// Fetch AI summary
export const fetchBookSummary = (bookId) => {
  return fetch(`${BASE_URL}/api/books/${bookId}/summary`).then(res => {
    if (!res.ok) {
      throw new Error('Failed to fetch summary')
    }
    return res.json()
  })
}
