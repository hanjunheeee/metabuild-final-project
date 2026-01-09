import { useNavigate } from 'react-router-dom'

/**
 * 책 정보 카드 컴포넌트
 * 게시글 목록, 상세 페이지, 댓글 등에서 책 정보를 표시할 때 사용
 * 
 * @param {Object} book - 책 정보 { bookId, title, author, coverUrl, publishedDate, isbn }
 * @param {string} size - 'sm' | 'md' | 'lg' (기본: 'md')
 * @param {boolean} showBookmark - 북마크 버튼 표시 여부
 * @param {boolean} isBookmarked - 북마크 여부
 * @param {Function} onBookmark - 북마크 클릭 핸들러
 * @param {boolean} bookmarkLoading - 북마크 로딩 상태
 * @param {Function} onClick - 카드 클릭 핸들러 (기본: 책 검색 페이지로 이동)
 * @param {boolean} disableNavigation - 클릭 시 페이지 이동 비활성화
 * @param {string} className - 추가 CSS 클래스
 */
function BookInfoCard({ 
  book,
  size = 'md',
  showBookmark = false,
  isBookmarked = false,
  onBookmark,
  bookmarkLoading = false,
  onClick,
  disableNavigation = false,
  className = ''
}) {
  const navigate = useNavigate()
  
  if (!book) return null

  // 사이즈별 스타일 설정
  const sizeStyles = {
    sm: {
      container: 'p-2',
      cover: 'w-12 h-16',
      coverIcon: 'w-5 h-5',
      title: 'text-xs font-medium line-clamp-1',
      author: 'text-xs',
      date: 'text-xs',
      bookmarkBtn: 'w-6 h-6',
      bookmarkIcon: 'w-3 h-3',
    },
    md: {
      container: 'p-3',
      cover: 'w-20 h-full',
      coverIcon: 'w-8 h-8',
      title: 'text-sm font-semibold line-clamp-2 leading-tight',
      author: 'text-xs',
      date: 'text-xs',
      bookmarkBtn: 'w-8 h-8',
      bookmarkIcon: 'w-4 h-4',
    },
    lg: {
      container: 'px-6 py-4',
      cover: 'w-24 h-32',
      coverIcon: 'w-10 h-10',
      title: 'text-base font-semibold line-clamp-2',
      author: 'text-sm',
      date: 'text-sm',
      bookmarkBtn: 'w-10 h-10',
      bookmarkIcon: 'w-5 h-5',
    },
  }

  const styles = sizeStyles[size] || sizeStyles.md

  const handleBookmarkClick = (e) => {
    e.stopPropagation()
    if (onBookmark) onBookmark(book)
  }

  const handleCardClick = (e) => {
    // 부모 요소로 이벤트 전파 방지 (게시글 카드 클릭과 분리)
    e.stopPropagation()
    
    // 커스텀 onClick이 있으면 실행
    if (onClick) {
      onClick(book)
      return
    }
    
    // 페이지 이동이 비활성화되어 있으면 아무것도 하지 않음
    if (disableNavigation) return
    
    // 기본 동작: 책 제목으로 검색 결과 페이지로 이동
    const keyword = book.title || book.isbn || ''
    if (keyword) {
      navigate(`/searchbook?keyword=${encodeURIComponent(keyword)}`)
    }
  }
  
  // 클릭 가능 여부 (onClick이 있거나, 네비게이션이 활성화된 경우)
  const isClickable = onClick || !disableNavigation

  return (
    <div 
      className={`bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100 ${styles.container} ${className} ${isClickable ? 'cursor-pointer hover:from-gray-100 hover:to-gray-150 transition-colors' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex gap-3 h-full">
        {/* 책 표지 이미지 */}
        <div className={`flex-shrink-0 ${styles.cover} bg-white rounded shadow-sm overflow-hidden border border-gray-200`}>
          {book.coverUrl ? (
            <img 
              src={book.coverUrl} 
              alt={book.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <svg className={`${styles.coverIcon} text-gray-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
        </div>

        {/* 책 정보 */}
        <div className="flex-1 flex flex-col justify-center overflow-hidden">
          <p className={`${styles.title} text-gray-800`}>
            {book.title || '제목 없음'}
          </p>
          <p className={`${styles.author} text-gray-500 mt-1 truncate`}>
            {book.author || '저자 미상'}
          </p>
          {book.publishedDate && (
            <p className={`${styles.date} text-gray-400 mt-0.5`}>
              {new Date(book.publishedDate).getFullYear()}년 출간
            </p>
          )}
        </div>

        {/* 북마크 버튼 */}
        {showBookmark && onBookmark && (
          <button
            onClick={handleBookmarkClick}
            disabled={bookmarkLoading}
            className={`flex-shrink-0 ${styles.bookmarkBtn} flex items-center justify-center rounded-full 
                      transition-all duration-200 cursor-pointer disabled:opacity-50
                      ${isBookmarked 
                        ? 'bg-yellow-400 text-white hover:bg-yellow-500' 
                        : 'bg-white border border-gray-300 text-gray-400 hover:border-yellow-400 hover:text-yellow-500'
                      }`}
            title={isBookmarked ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            {isBookmarked ? (
              <svg className={styles.bookmarkIcon} fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            ) : (
              <svg className={styles.bookmarkIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default BookInfoCard

