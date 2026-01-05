import { useState, useRef, useEffect } from 'react'

/**
 * 책 검색/선택 로직을 관리하는 커스텀 훅
 * 
 * @returns {Object} 책 검색 관련 상태와 핸들러
 */
function useBookSearch() {
  const [selectedBook, setSelectedBook] = useState(null)
  const [bookSearchTerm, setBookSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef(null)

  // 임시 책 목록 (실제로는 API에서 가져옴)
  // TODO: API 연동 시 useEffect로 fetchBooks 호출
  const mockBooks = [
    { bookId: 1, title: '클린 코드', author: '로버트 C. 마틴' },
    { bookId: 2, title: '리팩터링', author: '마틴 파울러' },
    { bookId: 3, title: '디자인 패턴', author: 'GoF' },
    { bookId: 4, title: '실용주의 프로그래머', author: '데이비드 토머스' },
    { bookId: 5, title: '코딩의 기술', author: '사이먼 알리슨' },
    { bookId: 6, title: '자바스크립트 완벽 가이드', author: '데이비드 플래너건' },
  ]

  // 검색어가 있을 때만 필터링
  const filteredBooks = bookSearchTerm.trim().length > 0
    ? mockBooks.filter(book =>
        book.title.toLowerCase().includes(bookSearchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(bookSearchTerm.toLowerCase())
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
    
    // 핸들러
    handleSearchChange,
    handleFocus,
    handleBookSelect,
    handleBookRemove,
    setSelectedBook,  // 외부에서 초기값 설정용
  }
}

export default useBookSearch

