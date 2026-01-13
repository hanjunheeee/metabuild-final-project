import BookInfoCard from '../BookInfoCard'
import { isAdmin, getDisplayName, getDisplayPhoto, getAdminBadge } from '@/shared/utils/userDisplay'

/**
 * 개별 답글 컴포넌트
 * 
 * @param {Object} reply - 답글 데이터
 * @param {boolean} isEditing - 수정 모드 여부
 * @param {number} currentUserId - 현재 로그인한 사용자 ID
 * @param {boolean} submitting - 제출 중 여부
 * @param {string} editText - 수정 텍스트
 * @param {Function} setEditText - 수정 텍스트 setter
 * @param {Object} editSelectedBook - 수정용 선택된 책
 * @param {Set} bookmarkedBookIds - 북마크한 책 ID Set
 * @param {number} bookmarkLoading - 로딩 중인 책 ID
 * @param {Function} onBookmark - 북마크 토글 핸들러
 * @param {Function} onStartEdit - 수정 시작
 * @param {Function} onCancelEdit - 수정 취소
 * @param {Function} onSubmitEdit - 수정 제출
 * @param {Function} onDelete - 삭제
 * @param {Function} onOpenBookModal - 책 검색 모달 열기
 * @param {Function} onRemoveEditBook - 수정용 책 제거
 * @param {Function} formatDate - 날짜 포맷 함수
 */
function ReplyItem({
  reply,
  isEditing,
  currentUserId,
  submitting,
  editText,
  setEditText,
  editSelectedBook,
  bookmarkedBookIds,
  bookmarkLoading,
  onBookmark,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onDelete,
  onOpenBookModal,
  onRemoveEditBook,
  onLike,
  likedCommentIds,
  formatDate,
}) {
  return (
    <div className="ml-8 mt-2 p-4 bg-gray-50 border border-gray-200 border-l-4 border-l-main-bg">
      {/* 답글 헤더 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3">
          {/* 프로필 이미지 */}
          <div className={`w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ${isAdmin(reply) ? 'ring-2 ring-yellow-400' : 'bg-gray-200'}`}>
            {getDisplayPhoto(reply) ? (
              <img 
                src={getDisplayPhoto(reply)} 
                alt={getDisplayName(reply)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-main-bg text-white text-xs font-bold">
                {getDisplayName(reply)[0].toUpperCase()}
              </div>
            )}
          </div>
          {/* 닉네임 + 시간 */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              {getAdminBadge(reply) && (
                <span className="text-sm">{getAdminBadge(reply)}</span>
              )}
              <span className={`text-sm font-medium ${isAdmin(reply) ? 'text-yellow-600' : 'text-gray-800'}`}>
                {getDisplayName(reply)}
              </span>
              {reply.updatedAt && (
                <span className="text-xs text-gray-400">(수정됨)</span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {formatDate(reply.createdAt)}
            </span>
          </div>
        </div>
        {/* 수정/삭제 버튼 (본인 답글만) */}
        {currentUserId === reply.userId && !isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onStartEdit(reply)}
              className="text-xs text-gray-500 hover:text-main-bg cursor-pointer"
            >
              수정
            </button>
            <button
              onClick={() => onDelete(reply.commentId)}
              className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 답글 내용 또는 수정 폼 */}
      {isEditing ? (
        <div className="pl-12">
          {/* 수정용 책 선택 표시 */}
          {editSelectedBook && (
            <div className="mb-2 relative max-w-sm">
              <BookInfoCard
                book={{
                  bookId: editSelectedBook.bookId,
                  title: editSelectedBook.title,
                  author: editSelectedBook.author,
                  coverUrl: editSelectedBook.imageUrl,
                }}
                size="sm"
                className="rounded-lg border border-blue-200"
              />
              <button
                type="button"
                onClick={onRemoveEditBook}
                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center 
                         bg-white border border-gray-300 rounded-full shadow-sm
                         text-gray-400 hover:text-red-500 cursor-pointer"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 focus:outline-none focus:border-main-bg text-sm"
              disabled={submitting}
              autoFocus
            />
            {/* 책 추가 버튼 */}
            {!editSelectedBook && (
              <button
                type="button"
                onClick={() => onOpenBookModal('edit')}
                className="px-2 py-1.5 border border-gray-300 text-gray-500 text-xs hover:bg-gray-50 cursor-pointer"
                title="책 태그 추가"
              >
                #책
              </button>
            )}
            <button
              type="button"
              onClick={() => onSubmitEdit(reply.commentId)}
              disabled={!editText.trim() || submitting}
              className="px-3 py-1.5 bg-main-bg text-white text-xs font-medium hover:bg-opacity-90 disabled:opacity-50 cursor-pointer"
            >
              저장
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs hover:bg-gray-50 cursor-pointer"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-700 leading-relaxed pl-12">
            {reply.content}
          </p>
          {/* 답글에 연결된 책 정보 카드 */}
          {reply.bookId && (
            <div className="mt-2 pl-12">
              <BookInfoCard
                book={{
                  bookId: reply.bookId,
                  title: reply.bookTitle,
                  author: reply.bookAuthor,
                  coverUrl: reply.bookImageUrl,
                }}
                size="sm"
                showBookmark={!!currentUserId}
                isBookmarked={bookmarkedBookIds.has(reply.bookId)}
                onBookmark={onBookmark}
                bookmarkLoading={bookmarkLoading === reply.bookId}
                className="rounded-lg border border-gray-200 max-w-sm"
              />
            </div>
          )}
          {/* 좋아요 버튼 */}
          <div className="mt-2 pl-12">
            <button
              onClick={() => onLike && onLike(reply.commentId)}
              className={`flex items-center gap-1 text-xs cursor-pointer transition-colors ${
                likedCommentIds?.has(reply.commentId) 
                  ? 'text-red-500' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
              title={likedCommentIds?.has(reply.commentId) ? '좋아요 취소' : '좋아요'}
            >
              <svg 
                className="w-4 h-4" 
                fill={likedCommentIds?.has(reply.commentId) ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{reply.likeCount || 0}</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ReplyItem

