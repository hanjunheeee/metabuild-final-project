import useCommentSection from '../../hooks/useCommentSection'
import Pagination from '@/shared/components/navigation/Pagination'
import { BookSearchModal } from '@/shared/components'
import BookInfoCard from '../BookInfoCard'
import CommentItem from './CommentItem'

/**
 * 댓글 섹션 컴포넌트
 * 댓글 목록, 작성, 수정, 삭제, 답글 기능을 제공
 */
function CommentSection({ communityId, currentUserId }) {
  const {
    // 로딩 상태
    loading,
    submitting,

    // 페이지네이션
    currentPage,
    totalPages,
    totalComments,
    handlePageChange,

    // 댓글 데이터
    parentComments,
    getReplies,
    expandedReplies,

    // 댓글 작성 폼
    commentText,
    commentInputRef,
    hashTriggerReady,
    handleCommentInputChange,
    handleCommentKeyDown,
    handleCommentSubmit,

    // 답글
    replyingTo,
    setReplyingTo,
    replyText,
    setReplyText,
    handleReplySubmit,
    handleCancelReplyWithBook,

    // 수정
    editingId,
    editText,
    setEditText,
    handleStartEditWithBook,
    handleCancelEditWithBook,
    handleEditSubmit,

    // 삭제
    handleDeleteComment,

    // 답글 펼치기
    toggleReplies,

    // 책 선택
    selectedBook,
    replySelectedBook,
    editSelectedBook,
    removeSelectedBook,
    removeEditBook,
    removeReplyBook,

    // 책 검색 모달
    showBookModal,
    openBookModal,
    closeBookModal,
    handleBookSelectFromModal,

    // 북마크
    bookmarkedBookIds,
    bookmarkLoading,
    handleBookmark,

    // 좋아요
    likedCommentIds,
    handleLikeComment,

    // 칭호
    userTitles,

    // 유틸
    formatDate,
  } = useCommentSection(communityId, currentUserId)

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-400 text-sm">
        댓글을 불러오는 중...
      </div>
    )
  }

  return (
    <div className="mt-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold text-gray-800">댓글</h3>
        <span className="text-sm text-gray-400">({totalComments})</span>
      </div>

      {/* 댓글 작성 폼 */}
      {currentUserId ? (
        <form onSubmit={handleCommentSubmit} className="mb-6">
          {/* 선택된 책 카드 표시 */}
          {selectedBook && (
            <div className="mb-3 relative">
              <BookInfoCard
                book={{
                  bookId: selectedBook.bookId,
                  title: selectedBook.title,
                  author: selectedBook.author,
                  coverUrl: selectedBook.imageUrl,
                  publishedDate: selectedBook.publishedDate,
                }}
                size="sm"
                className="rounded-lg border border-blue-200"
              />
              <button
                type="button"
                onClick={removeSelectedBook}
                className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center 
                         bg-white border border-gray-300 rounded-full shadow-sm
                         text-gray-400 hover:text-red-500 hover:border-red-300 
                         transition-colors cursor-pointer"
                title="책 태그 제거"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={handleCommentInputChange}
                onKeyDown={handleCommentKeyDown}
                placeholder={selectedBook ? "댓글을 입력하세요..." : "댓글을 입력하세요... (# + 스페이스로 책 태그)"}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-main-bg text-sm"
                disabled={submitting}
              />
              {hashTriggerReady && (
                <div className="absolute left-0 -bottom-6 text-xs text-main-bg">
                  스페이스를 눌러 책을 검색하세요
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="px-4 py-2 bg-main-bg text-white text-sm font-medium hover:bg-sub-bg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? '작성 중...' : '작성'}
            </button>
          </div>

          {/* 책 검색 모달 */}
          <BookSearchModal
            isOpen={showBookModal}
            onClose={closeBookModal}
            onSelect={handleBookSelectFromModal}
            footerText="책을 선택하면 댓글에 태그로 표시됩니다"
          />
        </form>
      ) : (
        <div className="mb-6 p-3 bg-gray-50 border border-gray-200 text-center text-sm text-gray-500">
          댓글을 작성하려면 로그인이 필요합니다.
        </div>
      )}

      {/* 댓글 목록 */}
      {parentComments.length === 0 ? (
        <div className="py-8 text-center bg-gray-50 border border-gray-200">
          <p className="text-gray-400 text-sm">아직 댓글이 없습니다.</p>
          <p className="text-gray-300 text-xs mt-1">첫 번째 댓글을 남겨보세요!</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {parentComments.map((comment) => (
              <CommentItem
                key={comment.commentId}
                comment={comment}
                replies={getReplies(comment.commentId)}
                isExpanded={expandedReplies.has(comment.commentId)}
                isEditing={editingId === comment.commentId}
                isReplying={replyingTo === comment.commentId}
                currentUserId={currentUserId}
                submitting={submitting}
                editText={editText}
                setEditText={setEditText}
                replyText={replyText}
                setReplyText={setReplyText}
                editSelectedBook={editSelectedBook}
                replySelectedBook={replySelectedBook}
                editingId={editingId}
                bookmarkedBookIds={bookmarkedBookIds}
                bookmarkLoading={bookmarkLoading}
                onBookmark={handleBookmark}
                onToggleReplies={toggleReplies}
                onStartEdit={handleStartEditWithBook}
                onCancelEdit={handleCancelEditWithBook}
                onSubmitEdit={handleEditSubmit}
                onDelete={handleDeleteComment}
                onStartReply={setReplyingTo}
                onCancelReply={handleCancelReplyWithBook}
                onSubmitReply={handleReplySubmit}
                onOpenBookModal={openBookModal}
                onRemoveEditBook={removeEditBook}
                onRemoveReplyBook={removeReplyBook}
                onLike={handleLikeComment}
                likedCommentIds={likedCommentIds}
                userTitles={userTitles}
                formatDate={formatDate}
              />
            ))}
          </div>

          {/* 페이징 */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            maxVisiblePages={5}
          />
        </>
      )}
    </div>
  )
}

export default CommentSection
