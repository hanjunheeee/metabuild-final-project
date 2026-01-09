import { useEffect } from 'react'
import useBookSearch from '@/feature/Community/hooks/useBookSearch'
import { Spinner } from '@/shared/components/icons'

/**
 * 책 검색 모달 컴포넌트
 * 
 * @param {boolean} isOpen - 모달 열림 상태
 * @param {Function} onClose - 모달 닫기 핸들러
 * @param {Function} onSelect - 책 선택 핸들러 (book) => void
 * @param {string} title - 모달 제목 (기본: "책 검색")
 * @param {string} footerText - 하단 안내 텍스트
 */
function BookSearchModal({ 
  isOpen, 
  onClose, 
  onSelect,
  title = "책 검색",
  footerText = "책을 선택하면 태그로 표시됩니다"
}) {
  const {
    bookSearchTerm,
    filteredBooks,
    searchRef,
    loading: bookLoading,
    handleSearchChange,
    handleFocus,
    handleBookSelect,
  } = useBookSearch()

  // 책 선택 시 처리
  const handleSelect = (book) => {
    handleBookSelect(book)
    onSelect(book)
    onClose()
  }

  // 모달 외부 클릭 시 닫기
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      if (!e.target.closest('.book-search-modal')) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="book-search-modal bg-white w-full max-w-md mx-4 shadow-xl">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-2xl font-extrabold text-main-bg">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 검색 입력 */}
        <div className="p-4" ref={searchRef}>
          <div className="relative">
            <input
              type="text"
              placeholder="책 제목 또는 저자로 검색..."
              value={bookSearchTerm}
              onChange={handleSearchChange}
              onFocus={handleFocus}
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200
                       focus:outline-none focus:ring-2 focus:ring-main-bg focus:border-transparent
                       text-gray-700 placeholder-gray-400"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <p className="mt-2 text-xs text-gray-400 text-center">
            💡 첫 검색 시에는 검색이 지연될 수 있습니다
          </p>

          {/* 검색 결과 */}
          <div className="mt-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {bookLoading ? (
              <div className="p-6 flex items-center justify-center gap-2">
                <Spinner className="w-5 h-5 text-main-bg" />
                <span className="text-gray-400 text-sm">책 목록을 불러오는 중...</span>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                {bookSearchTerm 
                  ? `"${bookSearchTerm}"에 대한 검색 결과가 없습니다`
                  : '검색어를 입력하세요'
                }
              </div>
            ) : (
              filteredBooks.map((book) => (
                <button
                  key={book.bookId}
                  type="button"
                  onClick={() => handleSelect(book)}
                  className="w-full p-4 text-left hover:bg-blue-50 transition-colors
                           border-b border-gray-100 last:border-b-0 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {/* 책 표지 */}
                    <div className="flex-shrink-0 w-10 h-14 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                      {book.imageUrl ? (
                        <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      )}
                    </div>
                    {/* 책 정보 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{book.title}</p>
                      <p className="text-sm text-gray-500 truncate">{book.author}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-400 text-center">
            {footerText}
          </p>
        </div>
      </div>
    </div>
  )
}

export default BookSearchModal

