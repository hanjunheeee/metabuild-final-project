import { useState, useRef, useEffect } from 'react'
import { fetchBooks } from '@/feature/Book/api/bookApi'

/**
 * 책 검색/선택 로직을 관리하는 커스텀 훅
 * 
 * @returns {Object} 책 검색 관련 상태와 핸들러
 */
function useBookSearch() {
  const [selectedBook, setSelectedBook] = useState(null)
  const [bookSearchTerm, setBookSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const searchRef = useRef(null)

  // 책 목록 로드
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true)
        const data = await fetchBooks()
        setBooks(data || [])
      } catch (err) {
        console.error('책 목록 로딩 실패:', err)
        setBooks([])
      } finally {
        setLoading(false)
      }
    }
    loadBooks()
  }, [])

  // 검색어가 있을 때만 필터링
  const filteredBooks = bookSearchTerm.trim().length > 0
    ? books.filter(book =>
        book.title?.toLowerCase().includes(bookSearchTerm.toLowerCase()) ||
        book.author?.toLowerCase().includes(bookSearchTerm.toLowerCase())
      )
    : []

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 검색어 변경 핸들러
  const handleSearchChange = (e) => {
    const value = e.target.value
    setBookSearchTerm(value)
    setShowDropdown(value.trim().length > 0)
  }

  // 포커스 시 드롭다운 표시
  const handleFocus = () => {
    if (bookSearchTerm.trim()) {
      setShowDropdown(true)
    }
  }

  // 책 선택
  const handleBookSelect = (book) => {
    setSelectedBook(book)
    setBookSearchTerm('')
    setShowDropdown(false)
  }

  // 책 선택 취소
  const handleBookRemove = () => {
    setSelectedBook(null)
  }

  return {
    // 상태
    selectedBook,
    bookSearchTerm,
    showDropdown,
    filteredBooks,
    searchRef,
    loading,
    
    // 핸들러
    handleSearchChange,
    handleFocus,
    handleBookSelect,
    handleBookRemove,
    setSelectedBook,  // 외부에서 초기값 설정용
  }
}

export default useBookSearch
