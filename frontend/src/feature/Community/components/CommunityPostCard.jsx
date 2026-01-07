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
 */
function CommunityPostCard({ post, onClick, formatDate, getPostTitle, getPreviewContent, getPostImages, currentUserId, onDelete, onAuthorClick }) {
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
      className="h-[340px] flex flex-col bg-white border border-gray-200 
               hover:border-main-bg hover:shadow-md cursor-pointer
               transition-all duration-200 overflow-hidden"
    >
      {/* 헤더: 작성자 정보 */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-100">
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
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            )}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  onAuthorClick && onAuthorClick(post.userId, post.authorNickname)
                }}
                className="font-semibold text-sm text-gray-800 hover:text-main-bg transition-colors cursor-pointer"
              >
                {post.authorNickname || '익명'}
              </button>
              {/* 책 정보 */}
              {post.bookTitle && (
                <span className="text-xs text-main-bg truncate max-w-[120px]">
                  「{post.bookTitle}」
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
          </div>
        </div>
        
        {/* 삭제 버튼 */}
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

      {/* 썸네일 이미지 (첫 번째 이미지만) */}
      {images.length > 0 && (
        <div className="flex-shrink-0 h-36 overflow-hidden bg-gray-100">
          <img 
            src={images[0]} 
            alt="썸네일" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

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

        {/* 미리보기 (썸네일 없을 때만 표시) */}
        {images.length === 0 && (
          <p className="flex-1 text-gray-600 text-sm leading-relaxed overflow-hidden line-clamp-4 whitespace-pre-line">
            {getPreviewContent(post)}
          </p>
        )}

        {/* 좋아요, 댓글 */}
        <div className="flex-shrink-0 flex items-center gap-4 pt-2 mt-auto border-t border-gray-100 text-sm text-gray-500">
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
      </div>
    </article>
  )
}

export default CommunityPostCard

