import ReplyItem from './ReplyItem'
import BookInfoCard from '../BookInfoCard'
import { isAdmin, getDisplayName, getDisplayPhoto, getAdminBadge } from '@/shared/utils/userDisplay'

/**
 * 개별 부모 댓글 컴포넌트
 * 
 * @param {Object} comment - 댓글 데이터
 * @param {Array} replies - 답글 목록
 * @param {boolean} isExpanded - 답글 펼침 여부
 * @param {boolean} isEditing - 수정 모드 여부
 * @param {boolean} isReplying - 답글 작성 모드 여부
 * @param {number} currentUserId - 현재 로그인한 사용자 ID
 * @param {boolean} submitting - 제출 중 여부
 * @param {string} editText - 수정 텍스트
 * @param {Function} setEditText - 수정 텍스트 setter
 * @param {string} replyText - 답글 텍스트
 * @param {Function} setReplyText - 답글 텍스트 setter
 * @param {Object} editSelectedBook - 수정용 선택된 책
 * @param {Object} replySelectedBook - 답글용 선택된 책
 * @param {Set} bookmarkedBookIds - 북마크한 책 ID Set
 * @param {number} bookmarkLoading - 로딩 중인 책 ID
 * @param {Function} onBookmark - 북마크 토글 핸들러
 * @param {Function} onToggleReplies - 답글 펼치기/접기
 * @param {Function} onStartEdit - 수정 시작
 * @param {Function} onCancelEdit - 수정 취소
 * @param {Function} onSubmitEdit - 수정 제출
 * @param {Function} onDelete - 삭제
 * @param {Function} onStartReply - 답글 시작
 * @param {Function} onCancelReply - 답글 취소
 * @param {Function} onSubmitReply - 답글 제출
 * @param {Function} onOpenBookModal - 책 검색 모달 열기
 * @param {Function} onRemoveEditBook - 수정용 책 제거
 * @param {Function} onRemoveReplyBook - 답글용 책 제거
 * @param {Function} formatDate - 날짜 포맷 함수
 */
function CommentItem({
  comment,
  replies,
  isExpanded,
  isEditing,
  isReplying,
  currentUserId,
  submitting,
  editText,
  setEditText,
  replyText,
  setReplyText,
  editSelectedBook,
  replySelectedBook,
  editingId,
  bookmarkedBookIds,
  bookmarkLoading,
  onBookmark,
  onToggleReplies,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onDelete,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  onOpenBookModal,
  onRemoveEditBook,
  onRemoveReplyBook,
  onLike,
  likedCommentIds,
  userTitles,
  formatDate,
}) {
  const replyCount = replies.length

  return (
    <div>
      {/* 부모 댓글 */}
      <div className="p-4 bg-white border border-gray-200">
        {/* 댓글 헤더 */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-3">
            {/* 프로필 이미지 */}
            <div className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ${isAdmin(comment) ? 'ring-2 ring-yellow-400' : 'bg-gray-200'}`}>
              {getDisplayPhoto(comment) ? (
                <img 
                  src={getDisplayPhoto(comment)} 
                  alt={getDisplayName(comment)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-main-bg text-white text-sm font-bold">
                  {getDisplayName(comment)[0].toUpperCase()}
                </div>
              )}
            </div>
            {/* 닉네임 + 시간 */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1 flex-wrap">
                {getAdminBadge(comment) && (
                  <span className="text-sm">{getAdminBadge(comment)}</span>
                )}
                <span className={`text-sm font-medium ${isAdmin(comment) ? 'text-yellow-600' : 'text-gray-800'}`}>
                  {getDisplayName(comment)}
                </span>
                {/* 칭호 표시 */}
                {!isAdmin(comment) && userTitles?.[comment.userId]?.length > 0 && (
                  <div className="flex items-center gap-1">
                    {userTitles[comment.userId].map((title) => (
                      <span 
                        key={title.titleId}
                        className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200"
                      >
                        {title.titleName}
                      </span>
                    ))}
                  </div>
                )}
                {comment.updatedAt && (
                  <span className="text-xs text-gray-400">(수정됨)</span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {formatDate(comment.createdAt)}
              </span>
            </div>
          </div>
          {/* 수정/삭제 버튼 (본인 댓글만) */}
          {currentUserId === comment.userId && !isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onStartEdit(comment)}
                className="text-xs text-gray-500 hover:text-main-bg cursor-pointer"
              >
                수정
              </button>
              <button
                onClick={() => onDelete(comment.commentId)}
                className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
              >
                삭제
              </button>
            </div>
          )}
        </div>

        {/* 댓글 내용 또는 수정 폼 */}
        {isEditing ? (
          <div className="pl-13">
            {/* 수정용 책 선택 표시 */}
            {editSelectedBook && (
              <div className="mb-2 relative max-w-md">
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
                onClick={() => onSubmitEdit(comment.commentId)}
                disabled={!editText.trim() || submitting}
                className="px-3 py-1.5 bg-main-bg text-white text-xs font-medium hover:bg-opacity-90 disabled:opacity-50"
              >
                저장
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-700 leading-relaxed pl-13">
              {comment.content}
            </p>
            {/* 댓글에 연결된 책 정보 카드 */}
            {comment.bookId && (
              <div className="mt-2 pl-13">
                <BookInfoCard
                  book={{
                    bookId: comment.bookId,
                    title: comment.bookTitle,
                    author: comment.bookAuthor,
                    coverUrl: comment.bookImageUrl,
                  }}
                  size="sm"
                  showBookmark={!!currentUserId}
                  isBookmarked={bookmarkedBookIds.has(comment.bookId)}
                  onBookmark={onBookmark}
                  bookmarkLoading={bookmarkLoading === comment.bookId}
                  className="rounded-lg border border-gray-200 max-w-md"
                />
              </div>
            )}
          </>
        )}

        {/* 답글 영역: 좋아요 + 펼치기/접기 + 답글 달기 */}
        {!isEditing && (
          <div className="mt-3 pl-13 flex items-center gap-4">
            {/* 좋아요 버튼 */}
            <button
              onClick={() => onLike && onLike(comment.commentId)}
              className={`flex items-center gap-1 text-xs cursor-pointer transition-colors ${
                likedCommentIds?.has(comment.commentId) 
                  ? 'text-red-500' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
              title={likedCommentIds?.has(comment.commentId) ? '좋아요 취소' : '좋아요'}
            >
              <svg 
                className="w-4 h-4" 
                fill={likedCommentIds?.has(comment.commentId) ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{comment.likeCount || 0}</span>
            </button>

            {/* 답글 펼치기/접기 버튼 */}
            {replyCount > 0 && (
              <button
                onClick={() => onToggleReplies(comment.commentId)}
                className="flex items-center gap-1 text-xs text-main-bg hover:underline cursor-pointer"
              >
                <span>{isExpanded ? '▼' : '▶'}</span>
                <span>{replyCount}개의 답글</span>
              </button>
            )}

            {/* 답글 달기 버튼 (로그인한 사용자만) */}
            {currentUserId && !isReplying && (
              <button
                onClick={() => onStartReply(comment.commentId)}
                className="text-xs text-gray-500 hover:text-main-bg cursor-pointer"
              >
                답글 달기
              </button>
            )}
          </div>
        )}

        {/* 답글 작성 폼 */}
        {isReplying && (
          <div className="mt-3 pl-13">
            {/* 답글용 책 선택 표시 */}
            {replySelectedBook && (
              <div className="mb-2 relative max-w-md">
                <BookInfoCard
                  book={{
                    bookId: replySelectedBook.bookId,
                    title: replySelectedBook.title,
                    author: replySelectedBook.author,
                    coverUrl: replySelectedBook.imageUrl,
                  }}
                  size="sm"
                  className="rounded-lg border border-blue-200"
                />
                <button
                  type="button"
                  onClick={onRemoveReplyBook}
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
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="답글을 입력하세요..."
                className="flex-1 px-3 py-1.5 border border-gray-300 focus:outline-none focus:border-main-bg text-sm"
                disabled={submitting}
                autoFocus
              />
              {/* 책 추가 버튼 */}
              {!replySelectedBook && (
                <button
                  type="button"
                  onClick={() => onOpenBookModal('reply')}
                  className="px-2 py-1.5 border border-gray-300 text-gray-500 text-xs hover:bg-gray-50 cursor-pointer"
                  title="책 태그 추가"
                >
                  #책
                </button>
              )}
              <button
                type="button"
                onClick={() => onSubmitReply(comment.commentId)}
                disabled={!replyText.trim() || submitting}
                className="px-3 py-1.5 bg-main-bg text-white text-xs font-medium hover:bg-opacity-90 disabled:opacity-50 cursor-pointer"
              >
                등록
              </button>
              <button
                type="button"
                onClick={onCancelReply}
                className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs hover:bg-gray-50 cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 답글 목록 (펼쳐진 경우에만 표시) */}
      {isExpanded && replies.map((reply) => (
        <ReplyItem
          key={reply.commentId}
          reply={reply}
          isEditing={editingId === reply.commentId}
          currentUserId={currentUserId}
          submitting={submitting}
          editText={editText}
          setEditText={setEditText}
          editSelectedBook={editSelectedBook}
          bookmarkedBookIds={bookmarkedBookIds}
          bookmarkLoading={bookmarkLoading}
          onBookmark={onBookmark}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          onSubmitEdit={onSubmitEdit}
          onDelete={onDelete}
          onOpenBookModal={onOpenBookModal}
          onRemoveEditBook={onRemoveEditBook}
          onLike={onLike}
          likedCommentIds={likedCommentIds}
          userTitles={userTitles}
          formatDate={formatDate}
        />
      ))}
    </div>
  )
}

export default CommentItem

