import { useState, useEffect } from 'react'
import { getUserFromSession } from '@/shared/api/authApi'
import { fetchBookmarksByUser, toggleBookmark } from '@/shared/api/bookmarkApi'
import { Spinner } from '@/shared/components/icons'

function MyBookmarksPage() {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)
  
  const currentUser = getUserFromSession()

  // 북마크 목록 로드
  useEffect(() => {
    const loadBookmarks = async () => {
      if (!currentUser?.userId) return
      
      try {
        setLoading(true)
        const data = await fetchBookmarksByUser(currentUser.userId)
        setBookmarks(data || [])
      } catch (error) {
        console.error('북마크 목록 로딩 실패:', error)
      } finally {
        setLoading(false)
      }
    }
    loadBookmarks()
  }, [currentUser?.userId])

  // 북마크 해제
  const handleRemoveBookmark = async (bookId) => {
    if (!currentUser?.userId) return
    
    try {
      setRemovingId(bookId)
      const result = await toggleBookmark(currentUser.userId, bookId)
      if (result.success && !result.bookmarked) {
        setBookmarks(prev => prev.filter(b => b.bookId !== bookId))
      }
    } catch (error) {
      console.error('북마크 해제 실패:', error)
    } finally {
      setRemovingId(null)
    }
  }

  // 날짜 포맷
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const yy = String(date.getFullYear()).slice(-2)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yy}.${mm}.${dd}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-8 h-8 text-main-bg" />
          <p className="text-gray-400 text-sm">즐겨찾기 도서를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">즐겨찾기 도서</h2>
        <p className="text-gray-400 text-sm mt-1">내가 즐겨찾기한 도서를 확인할 수 있습니다.</p>
      </div>

      {/* 통계 */}
      <div className="mb-6 text-sm text-gray-500">
        총 <strong className="text-gray-800">{bookmarks.length}</strong>권의 도서
      </div>

      {/* 도서 목록 */}
      <div className="border border-gray-200">
        {bookmarks.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            즐겨찾기한 도서가 없습니다.
          </div>
        ) : (
          bookmarks.map((bookmark, index) => (
            <div
              key={bookmark.bookmarkId}
              className={`flex gap-4 p-4 hover:bg-gray-50 transition-colors group ${
                index !== bookmarks.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              {/* 책 표지 */}
              <div className="w-16 h-22 bg-gray-100 flex items-center justify-center flex-shrink-0 rounded overflow-hidden border border-gray-200">
                {bookmark.bookImageUrl ? (
                  <img 
                    src={bookmark.bookImageUrl} 
                    alt={bookmark.bookTitle} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
              </div>

              {/* 책 정보 */}
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-gray-800 truncate group-hover:text-main-bg transition-colors">
                    {bookmark.bookTitle || '제목 없음'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {bookmark.bookAuthor || '저자 미상'}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs text-gray-400">{formatDate(bookmark.favoriteDate)}</span>
                  <button 
                    onClick={() => handleRemoveBookmark(bookmark.bookId)}
                    disabled={removingId === bookmark.bookId}
                    className="w-8 h-8 flex items-center justify-center rounded-full 
                             bg-yellow-400 text-white hover:bg-yellow-500
                             transition-all duration-200 cursor-pointer disabled:opacity-50"
                    title="즐겨찾기 해제"
                  >
                    {removingId === bookmark.bookId ? (
                      <Spinner className="w-4 h-4" />
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MyBookmarksPage
