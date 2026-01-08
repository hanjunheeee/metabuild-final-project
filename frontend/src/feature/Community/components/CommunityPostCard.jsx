/**
 * 커뮤니티 게시글 카드 컴포넌트 (인스타그램 스타일)
 * 
 * @param {Object} post - 게시글 데이터
 * @param {Function} onClick - 클릭 핸들러
 * @param {Function} formatDate - 날짜 포맷 함수
 * @param {Function} getPostTitle - 제목 추출 함수
 * @param {Function} getPreviewContent - 미리보기 추출 함수
 * @param {Function} getPostImages - 이미지 추출 함수
 * @param {number} currentUserId - 현재 로그인한 사용자 ID
 * @param {Function} onDelete - 삭제 핸들러
 * @param {Function} onAuthorClick - 작성자 클릭 핸들러
 * @param {boolean} preferBookInfo - true이면 책 정보 우선 표시 (리뷰 게시글용)
 * @param {boolean} isHot - true이면 HOT 배지 표시
 * @param {Function} onBookmark - 북마크 토글 핸들러
 * @param {Set} bookmarkedBookIds - 북마크한 책 ID Set
 */
function CommunityPostCard({ post, onClick, formatDate, getPostTitle, getPreviewContent, getPostImages, currentUserId, onDelete, onAuthorClick, preferBookInfo = false, isHot = false, onBookmark, bookmarkedBookIds }) {
  // 북마크 상태 확인
  const isBookmarked = bookmarkedBookIds && post.bookId && bookmarkedBookIds.has(post.bookId)

  // 북마크 버튼 클릭 핸들러
  const handleBookmark = (e) => {
    e.stopPropagation() // 카드 클릭 이벤트 전파 방지
    if (onBookmark && post.bookId) {
      onBookmark(post.bookId)
    }
  }
  // 삭제 버튼 클릭 핸들러
  const handleDelete = (e) => {
    e.stopPropagation() // 카드 클릭 이벤트 전파 방지
    if (window.confirm('정말 삭제하시겠습니까?')) {
      onDelete(post.communityId)
    }
  }

  const isMyPost = currentUserId && post.userId === currentUserId
  const images = getPostImages ? getPostImages(post) : []

  return (
    <article
      onClick={() => onClick(post.communityId)}
      className={`h-[340px] flex flex-col bg-white border relative
               hover:shadow-md cursor-pointer transition-all duration-200 overflow-hidden
               ${isHot ? 'border-red-300 hover:border-red-400' : 'border-gray-200 hover:border-main-bg'}`}
    >
      {/* HOT 배지 */}
      {isHot && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white 
                        text-xs font-bold px-3 py-1 rounded-bl-lg shadow-md
                        flex items-center gap-1">
            <span>🔥</span>
            <span>HOT</span>
          </div>
        </div>
      )}
      
      {/* 헤더: 작성자 정보 */}
      <div className="flex-shrink-0 flex items-center p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {/* 프로필 사진 (클릭 시 작성자 게시글 목록으로 이동) */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAuthorClick && onAuthorClick(post.userId, post.authorNickname)
            }}
            className="w-8 h-8 rounded-full bg-gray-200 
                        flex items-center justify-center overflow-hidden
                        hover:ring-2 hover:ring-main-bg transition-all cursor-pointer"
          >
            {post.authorPhoto ? (
              <img src={`http://localhost:7878/uploads/profile/${post.authorPhoto}`} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-main-bg text-white text-xs font-bold">
                {(post.authorNickname || '?')[0].toUpperCase()}
              </div>
            )}
          </button>
          <div>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                onAuthorClick && onAuthorClick(post.userId, post.authorNickname)
              }}
              className="block font-semibold text-sm text-gray-800 hover:text-main-bg transition-colors cursor-pointer"
            >
              {post.authorNickname || '익명'}
            </button>
            <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* 썸네일 영역: preferBookInfo에 따라 우선순위 변경 */}
      {/* preferBookInfo=true (리뷰): 책 정보 > 이미지 > 없음 */}
      {/* preferBookInfo=false (전체): 이미지 > 책 정보 > 없음 */}
      {preferBookInfo && post.bookId ? (
        // 리뷰 필터: 책 정보 우선 표시
        null // 아래 책 정보 블록으로 이동
      ) : images.length > 0 ? (
        // 본문에 이미지가 있으면 썸네일로 표시
        <div className="flex-shrink-0 h-36 overflow-hidden bg-gray-100">
          <img 
            src={images[0]} 
            alt="썸네일" 
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}
      
      {/* 책 정보 표시: preferBookInfo=true면 무조건, false면 이미지 없을 때만 */}
      {post.bookId && (preferBookInfo || images.length === 0) ? (
        // 2. 책이 선택되어 있으면 책 정보 카드 표시
        <div className="flex-shrink-0 h-36 p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100">
          <div className="flex gap-3 h-full">
            {/* 책 표지 이미지 */}
            <div className="flex-shrink-0 w-20 h-full bg-white rounded shadow-sm overflow-hidden border border-gray-200">
              {post.bookCoverUrl ? (
                <img 
                  src={post.bookCoverUrl} 
                  alt={post.bookTitle} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
            </div>
            {/* 책 정보 */}
            <div className="flex-1 flex flex-col justify-center overflow-hidden">
              <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                {post.bookTitle || '제목 없음'}
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {post.bookAuthor || '저자 미상'}
              </p>
              {post.bookPublishedDate && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(post.bookPublishedDate).getFullYear()}년 출간
                </p>
              )}
            </div>
            {/* 북마크 버튼 */}
            {onBookmark && currentUserId && (
              <button
                onClick={handleBookmark}
                className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full 
                          transition-all duration-200 cursor-pointer
                          ${isBookmarked 
                            ? 'bg-yellow-400 text-white hover:bg-yellow-500' 
                            : 'bg-white border border-gray-300 text-gray-400 hover:border-yellow-400 hover:text-yellow-500'
                          }`}
                title={isBookmarked ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              >
                {isBookmarked ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* 본문 영역 */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden">
        {/* 배지 */}
        <div className="flex-shrink-0 flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full
            ${post.communityKind === 'QUESTION' 
              ? 'bg-purple-100 text-purple-600'
              : post.communityKind === 'REVIEW'
              ? 'bg-green-100 text-green-600'
              : 'bg-gray-100 text-gray-600'
            }`}>
            {post.communityKind === 'QUESTION' ? '질문' 
              : post.communityKind === 'REVIEW' ? '리뷰' 
              : '자유'}
          </span>
        </div>

        {/* 제목 */}
        <h2 className="flex-shrink-0 text-base font-bold text-gray-800 mb-2 line-clamp-1">
          {getPostTitle(post)}
        </h2>

        {/* 미리보기 (썸네일도 없고 책 정보도 없을 때만 표시) */}
        {images.length === 0 && !post.bookId && (
          <p className="flex-1 text-gray-600 text-sm leading-relaxed overflow-hidden line-clamp-4 whitespace-pre-line">
            {getPreviewContent(post)}
          </p>
        )}

        {/* 좋아요, 댓글, 삭제 */}
        <div className="flex-shrink-0 flex items-center justify-between pt-2 mt-auto border-t border-gray-100 text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{post.communityGreat || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{post.commentCount || 0}</span>
            </div>
          </div>
          
          {/* 삭제 버튼 (우측 하단) */}
          {isMyPost && onDelete && (
            <button
              onClick={handleDelete}
              className="px-2 py-1 text-xs text-red-600 cursor-pointer
                       border border-red-200 hover:bg-red-50 rounded transition-colors"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default CommunityPostCard

