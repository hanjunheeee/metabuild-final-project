import { useEffect, useRef, useState } from 'react'
import BookInfoCard from './BookInfoCard'
import { isAdmin, getDisplayName, getDisplayPhoto } from '@/shared/utils/userDisplay'

// 칭호 레벨별 스타일
const getTitleLevelStyle = (level) => {
  switch (level) {
    case 'GOLD':
      return 'bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 text-amber-900 border-amber-400 shadow-sm'
    case 'SILVER':
      return 'bg-gray-200 text-gray-600 border-gray-400'
    case 'BRONZE':
      return 'bg-orange-100 text-orange-700 border-orange-300'
    case 'NEWBIE':
      return 'bg-green-100 text-green-700 border-green-300'
    default:
      return 'bg-main-bg/5 text-main-bg border-main-bg/30'
  }
}

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
function CommunityPostList({
  post,
  onClick,
  formatDate,
  getPostTitle,
  badge,
  isHot = false,
  variant = 'card',
  userTitles = {},
  onAuthorClick,
  selectedAuthor,
  selectedAuthorPostId,
  onCloseAuthorPanel,
  onToggleAuthorFollow,
  authorFollowing,
  authorFollowLoading,
  currentUser,
  onViewAuthorPosts,
}) {
  const [showBookInfo, setShowBookInfo] = useState(false)
  const authorPanelOpen = selectedAuthorPostId === post.communityId
  const authorPanelRef = useRef(null)
  const authorButtonRef = useRef(null)
  useEffect(() => {
    if (!authorPanelOpen) return
    const handleOutsideClick = (event) => {
      if (authorPanelRef.current?.contains(event.target)) return
      if (authorButtonRef.current?.contains(event.target)) return
      onCloseAuthorPanel && onCloseAuthorPanel()
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [authorPanelOpen, onCloseAuthorPanel])
  
  // 작성자 정보를 userDisplay 유틸에 맞는 형식으로 변환
  const author = {
    role: post.authorRole,
    nickname: post.authorNickname,
  }
  const isAuthorAdmin = isAdmin(author)
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
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <h2 className="text-sm text-gray-800 truncate hover:text-main-bg">
              {(() => {
                const title = getPostTitle(post)
                return title.length > 30 ? title.slice(0, 30) + '...' : title
              })()}
            </h2>
            {post.bookTitle && (
              <div 
                className="relative flex-shrink-0"
                onMouseEnter={() => setShowBookInfo(true)}
                onMouseLeave={() => setShowBookInfo(false)}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-gray-400 cursor-help">
                  📖 {post.bookTitle.length > 15 ? post.bookTitle.slice(0, 15) + '...' : post.bookTitle}
                </span>
                {showBookInfo && (
                  <div className="absolute left-0 top-full mt-1 z-50 w-72 shadow-lg rounded-lg overflow-hidden bg-white border border-gray-200">
                    {post.bookId && post.bookCoverUrl ? (
                      <BookInfoCard
                        book={{
                          bookId: post.bookId,
                          title: post.bookTitle,
                          author: post.bookAuthor,
                          coverUrl: post.bookCoverUrl,
                          publishedDate: post.bookPublishedDate,
                        }}
                        size="sm"
                        showBookmark={false}
                        disableNavigation={true}
                      />
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        <p className="mb-1">📖</p>
                        <p className="font-medium">{post.bookTitle}</p>
                        <p className="text-xs text-gray-400 mt-1">정보가 없는 책입니다</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {post.commentCount > 0 && (
              <span className="text-xs text-main-bg flex-shrink-0">({post.commentCount})</span>
            )}
          </div>
          
          {/* 작성자 */}
          <div className={`relative text-xs flex-shrink-0 w-44 text-left flex items-center justify-start gap-1 pl-8 ${
            isAuthorAdmin ? 'text-blue-600' : 'text-gray-500'
          }`}>
            {/* 관리자일 때는 "관리자" 칭호, 일반 사용자는 보유 칭호 표시 */}
            {isAuthorAdmin ? (
              <span className="text-[10px] font-semibold px-1 py-0.5 border rounded border-blue-200 bg-blue-50 text-blue-600">
                관리자
              </span>
            ) : userTitles?.[post.userId]?.length > 0 && (
              <span className={`text-[10px] font-medium px-1 py-0.5 border rounded ${getTitleLevelStyle(userTitles[post.userId][0]?.titleLevel)}`}>
                {userTitles[post.userId][0]?.titleName}
              </span>
            )}
            {onAuthorClick ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  if (authorPanelOpen) {
                    onCloseAuthorPanel && onCloseAuthorPanel()
                  } else {
                    onAuthorClick(
                      post.communityId,
                      post.userId,
                      getDisplayName(author),
                      post.authorPhoto,
                      post.authorRole
                    )
                  }
                }}
                className="truncate hover:underline cursor-pointer"
                ref={authorButtonRef}
              >
                {getDisplayName(author)}
              </button>
            ) : (
              <span className="truncate">{getDisplayName(author)}</span>
            )}
            {authorPanelOpen && selectedAuthor && (
              <div
                ref={authorPanelRef}
                className="absolute left-full top-1/2 ml-3 w-64 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg z-30"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={onCloseAuthorPanel}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  aria-label="닫기"
                >
                  ×
                </button>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                    {getDisplayPhoto(selectedAuthor) ? (
                      <img
                        src={getDisplayPhoto(selectedAuthor)}
                        alt={selectedAuthor.nickname || '사용자'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (selectedAuthor.nickname || 'U')[0]
                    )}
                  </div>
                  <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <span>{selectedAuthor.nickname || '사용자'}</span>
                    {isAdmin(selectedAuthor) && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-600">
                        관리자
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {!isAdmin(selectedAuthor) && currentUser?.userId !== selectedAuthor.userId && (
                    <button
                      type="button"
                      onClick={onToggleAuthorFollow}
                      disabled={authorFollowLoading}
                      className="w-full rounded-md border border-main-bg bg-main-bg px-3 py-2 text-xs font-medium text-white hover:bg-sub-bg transition-colors disabled:opacity-70 disabled:cursor-default"
                    >
                      {authorFollowLoading ? '처리 중...' : (authorFollowing ? '언팔로잉' : '팔로잉')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onViewAuthorPosts && onViewAuthorPosts(selectedAuthor.userId, selectedAuthor.nickname)
                      onCloseAuthorPanel && onCloseAuthorPanel()
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    작성자 게시물 보기
                  </button>
                </div>
              </div>
            )}
          </div>
          
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
        
        {/* 제목 + 책 제목 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-800 truncate">
            {getPostTitle(post)}
          </h2>
          {post.bookTitle && (
            <span className="text-xs text-gray-400 truncate max-w-[120px] flex-shrink-0">
              📖 {post.bookTitle}
            </span>
          )}
        </div>
        
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

export default CommunityPostList
