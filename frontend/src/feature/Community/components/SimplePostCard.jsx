/**
 * 한 줄 형태의 게시글 목록 아이템 컴포넌트
 * 공지, 자유, 질문 게시글에서 사용
 * 
 * @param {Object} post - 게시글 데이터
 * @param {Function} onClick - 클릭 핸들러
 * @param {Function} formatDate - 날짜 포맷 함수
 * @param {Function} getPostTitle - 제목 추출 함수
 * @param {Object} badge - 배지 정보 { text: string, color: 'amber' | 'gray' | 'purple' }
 * @param {boolean} isHot - true이면 HOT 표시
 * @param {string} variant - 'card' (배경색 카드) | 'table' (테이블 행)
 */
function SimplePostCard({ post, onClick, formatDate, getPostTitle, badge, isHot = false, variant = 'card' }) {
  // 배지 색상 스타일
  const badgeStyles = {
    amber: 'bg-amber-500 text-white',
    gray: 'bg-gray-500 text-white',
    purple: 'bg-purple-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
  }

  // 카드 스타일 배경색
  const cardBgStyles = {
    amber: 'bg-amber-50 border-amber-200 hover:border-amber-400',
    gray: 'bg-gray-50 border-gray-200 hover:border-gray-400',
    purple: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    blue: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    green: 'bg-green-50 border-green-200 hover:border-green-400',
  }

  // 테이블 스타일 배지 (텍스트만)
  const tableBadgeStyles = {
    amber: 'text-amber-600',
    gray: 'text-gray-500',
    purple: 'text-purple-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
  }

  const badgeColor = badge?.color || 'gray'

  // 테이블 스타일
  if (variant === 'table') {
    return (
      <article
        onClick={() => onClick(post.communityId)}
        className="border-b border-gray-100 py-3 px-2
                   hover:bg-gray-50 cursor-pointer
                   transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          {/* 카테고리 */}
          <span className={`flex-shrink-0 text-xs ${tableBadgeStyles[badgeColor]} w-12 truncate`}>
            {badge?.text || '일반'}
          </span>
          
          {/* HOT 표시 */}
          {isHot && (
            <span className="flex-shrink-0 text-red-500 text-xs">🔥</span>
          )}
          
          {/* 제목 */}
          <h2 className="text-sm text-gray-800 truncate flex-1 hover:text-main-bg">
            {getPostTitle(post)}
            {post.commentCount > 0 && (
              <span className="text-xs text-main-bg ml-1">({post.commentCount})</span>
            )}
          </h2>
          
          {/* 작성자 */}
          <span className="text-xs text-gray-500 flex-shrink-0 w-20 truncate text-center">
            {post.authorNickname || '익명'}
          </span>
          
          {/* 날짜 */}
          <span className="text-xs text-gray-400 flex-shrink-0 w-20 text-center whitespace-nowrap">
            {formatDate(post.createdAt)}
          </span>
          
          {/* 추천 */}
          <span className="text-xs text-gray-400 flex-shrink-0 w-10 text-center">
            {post.communityGreat || 0}
          </span>
        </div>
      </article>
    )
  }

  // 카드 스타일 (기본)
  return (
    <article
      onClick={() => onClick(post.communityId)}
      className={`${cardBgStyles[badgeColor]} border p-4 
                 hover:shadow-sm cursor-pointer
                 transition-all duration-200`}
    >
      <div className="flex items-center gap-3">
        {/* 배지 */}
        <span className={`flex-shrink-0 px-2 py-1 text-xs font-bold ${badgeStyles[badgeColor]}`}>
          {badge?.text || '일반'}
        </span>
        
        {/* HOT 표시 */}
        {isHot && (
          <span className="flex-shrink-0 text-red-500 text-xs font-bold">🔥</span>
        )}
        
        {/* 제목 */}
        <h2 className="text-sm font-bold text-gray-800 truncate flex-1">
          {getPostTitle(post)}
        </h2>
        
        {/* 좋아요/댓글 수 */}
        <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {post.communityGreat || 0}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post.commentCount || 0}
          </span>
        </div>
        
        {/* 날짜 */}
        <span className="text-xs text-gray-400 flex-shrink-0">
          {formatDate(post.createdAt)}
        </span>
      </div>
    </article>
  )
}

export default SimplePostCard
