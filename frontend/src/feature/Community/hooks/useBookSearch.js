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
  const isSelectingRef = useRef(false) // 책 선택 중 (모든 onChange 무시)

  // Debounce된 검색 함수
  const debouncedSearch = useCallback(async (query) => {
    console.log('[useBookSearch] debouncedSearch 호출:', query)
    // 2글자 미만이면 검색하지 않음
    if (query.trim().length < 2) {
      setFilteredBooks([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('[useBookSearch] API 호출 시작:', query)
      const data = await searchBooks(query)
      console.log('[useBookSearch] API 호출 완료, 결과 수:', data?.length)
      setFilteredBooks(data || [])
    } catch (err) {
      console.error('책 검색 실패:', err)
      setFilteredBooks([])
    } finally {
      setLoading(false)
    }
  }, [])

  // 마지막 유효 검색어 저장 (결과가 있을 때의 검색어)
  const lastValidTermRef = useRef('')

  // 검색어 변경 시 Debounce 적용
  useEffect(() => {
    console.log('[useBookSearch] useEffect 실행, bookSearchTerm:', bookSearchTerm, 'filteredBooks:', filteredBooks.length)
    
    // 2글자 미만일 때
    if (bookSearchTerm.trim().length < 2) {
      // 결과가 이미 있고, 마지막 유효 검색어가 있으면 → IME 버그로 인한 잘못된 값이므로 무시
      if (filteredBooks.length > 0 && lastValidTermRef.current.length >= 2) {
        console.log('[useBookSearch] 결과 있음, 잘못된 값 무시. 마지막 유효:', lastValidTermRef.current)
        return
      }
      console.log('[useBookSearch] 2글자 미만, 결과 초기화')
      setFilteredBooks([])
      lastValidTermRef.current = ''
      return
    }

    // 유효한 검색어 저장
    lastValidTermRef.current = bookSearchTerm

    // 이전 타이머 취소
    if (debounceRef.current) {
      console.log('[useBookSearch] 이전 타이머 취소')
      clearTimeout(debounceRef.current)
    }

    // 300ms 후 검색 실행
    console.log('[useBookSearch] 300ms 타이머 설정')
    debounceRef.current = setTimeout(() => {
      console.log('[useBookSearch] 타이머 실행, 검색어:', bookSearchTerm)
      debouncedSearch(bookSearchTerm)
    }, 300)

    return () => {
      if (debounceRef.current) {
        console.log('[useBookSearch] cleanup - 타이머 취소')
        clearTimeout(debounceRef.current)
      }
    }
  }, [bookSearchTerm, debouncedSearch, filteredBooks.length])

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
    // 책 선택 중이면 변경 무시 (IME 버그 방지)
    if (isSelectingRef.current) {
      console.log('[useBookSearch] 선택 중, onChange 무시:', e.target.value)
      return
    }
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

  // 책 선택 시작 (onMouseDown에서 호출) - 모든 onChange 무시 시작
  const startSelecting = () => {
    console.log('[useBookSearch] startSelecting - 선택 시작')
    isSelectingRef.current = true
  }

  // 책 선택
  const handleBookSelect = (book) => {
    console.log('[useBookSearch] handleBookSelect 호출:', book.title)
    console.log('[useBookSearch] debounceRef.current:', debounceRef.current)
    // 진행 중인 debounce 타이머 즉시 취소 (검색 재실행 방지)
    if (debounceRef.current) {
      console.log('[useBookSearch] debounce 타이머 취소')
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    setSelectedBook(book)
    setBookSearchTerm('')
    setShowDropdown(false)
    setFilteredBooks([]) // 즉시 결과 초기화
    
    // 선택 완료 후 플래그 해제 (약간의 딜레이 후)
    setTimeout(() => {
      console.log('[useBookSearch] 선택 완료 - 플래그 해제')
      isSelectingRef.current = false
    }, 100)
    
    console.log('[useBookSearch] handleBookSelect 완료')
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
    startSelecting,
    handleBookSelect,
    handleBookRemove,
    setSelectedBook,  // 외부에서 초기값 설정용
  }
}

export default useBookSearch
