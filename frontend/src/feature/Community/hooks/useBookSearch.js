import { useState, useRef, useEffect, useCallback } from 'react'
import { searchBooks } from '@/feature/Book/api/bookApi'

/**
 * 책 검색/선택 로직을 관리하는 커스텀 훅
 * - Debounce 300ms 적용
 * - 최소 2글자 이상 입력 시 검색
 * - API 검색 방식 (대용량 데이터 최적화)
 * 
 * @returns {Object} 책 검색 관련 상태와 핸들러
 */
function useBookSearch() {
  const [selectedBook, setSelectedBook] = useState(null)
  const [bookSearchTerm, setBookSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredBooks, setFilteredBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  // Debounce된 검색 함수
  const debouncedSearch = useCallback(async (query) => {
    // 2글자 미만이면 검색하지 않음
    if (query.trim().length < 2) {
      setFilteredBooks([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await searchBooks(query)
      setFilteredBooks(data || [])
    } catch (err) {
      console.error('책 검색 실패:', err)
      setFilteredBooks([])
    } finally {
      setLoading(false)
    }
  }, [])

  // 검색어 변경 시 Debounce 적용
  useEffect(() => {
    // 2글자 미만이면 즉시 빈 결과
    if (bookSearchTerm.trim().length < 2) {
      setFilteredBooks([])
      return
    }

    // 이전 타이머 취소
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // 300ms 후 검색 실행
    debounceRef.current = setTimeout(() => {
      debouncedSearch(bookSearchTerm)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [bookSearchTerm, debouncedSearch])

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
