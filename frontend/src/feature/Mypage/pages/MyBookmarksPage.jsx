function MyBookmarksPage() {
  // 더미 데이터 (실제 구현 시 API 연동)
  const dummyBookmarks = [
    { 
      id: 1, 
      title: '데미안', 
      author: '헤르만 헤세', 
      publisher: '민음사',
      coverUrl: null,
      addedAt: '2025-01-05' 
    },
    { 
      id: 2, 
      title: '어린왕자', 
      author: '생텍쥐페리', 
      publisher: '열린책들',
      coverUrl: null,
      addedAt: '2025-01-03' 
    },
    { 
      id: 3, 
      title: '1984', 
      author: '조지 오웰', 
      publisher: '민음사',
      coverUrl: null,
      addedAt: '2025-01-01' 
    },
  ]

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">즐겨찾기 도서</h2>
        <p className="text-gray-400 text-sm mt-1">내가 즐겨찾기한 도서를 확인할 수 있습니다.</p>
      </div>

      {/* 통계 */}
      <div className="mb-6 text-sm text-gray-500">
        총 <strong className="text-gray-800">{dummyBookmarks.length}</strong>권의 도서
      </div>

      {/* 도서 목록 */}
      <div className="border border-gray-200">
        {dummyBookmarks.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            즐겨찾기한 도서가 없습니다.
          </div>
        ) : (
          dummyBookmarks.map((book, index) => (
            <div
              key={book.id}
              className={`flex gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                index !== dummyBookmarks.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              {/* 책 표지 */}
              <div className="w-12 h-16 bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs text-gray-400">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  '표지'
                )}
              </div>

              {/* 책 정보 */}
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-gray-800 truncate group-hover:text-main-bg transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-500">{book.author} · {book.publisher}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs text-gray-400">{book.addedAt}</span>
                  <button 
                    className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-red-500 border border-red-300 hover:bg-red-50 transition-all"
                  >
                    해제
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
