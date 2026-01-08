const BASE_URL = 'http://localhost:7878'

// Fetch all books (optionally filtered by query)
export const fetchBooks = (query = '') => {
  const trimmed = query.trim()
  const url = trimmed
    ? `${BASE_URL}/api/books?query=${encodeURIComponent(trimmed)}`
    : `${BASE_URL}/api/books`
  return fetch(url).then(res => res.json())
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

// Fetch Aladin bestseller TOP10
export const fetchAladinBestsellers = () => {
  return fetch(`${BASE_URL}/api/books/bestsellers/aladin`).then(res => {
    if (!res.ok) {
      throw new Error('Failed to fetch Aladin bestsellers')
    }
    return res.json()
  })
}

// Fetch Kyobo bestseller TOP10 (scraped)
export const fetchKyoboBestsellers = () => {
  return fetch(`${BASE_URL}/api/books/bestsellers/kyobo`).then(res => {
    if (!res.ok) {
      throw new Error('Failed to fetch Kyobo bestsellers')
    }
    return res.json()
  })
}

// Fetch YES24 bestseller TOP10 (scraped)
export const fetchYes24Bestsellers = () => {
  return fetch(`${BASE_URL}/api/books/bestsellers/yes24`).then(res => {
    if (!res.ok) {
      throw new Error('Failed to fetch YES24 bestsellers')
    }
    return res.json()
  })
}
