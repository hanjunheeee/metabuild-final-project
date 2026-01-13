import { useState, useRef, useEffect } from 'react'
import useComments from '../../hooks/useComments'
import Pagination from '@/shared/components/navigation/Pagination'
import { BookSearchModal } from '@/shared/components'
import BookInfoCard from '../BookInfoCard'
import CommentItem from './CommentItem'
import { fetchBookmarkedBookIds, toggleBookmark } from '@/shared/api/bookmarkApi'
import { toggleCommentLike, fetchLikedCommentIds } from '../../api/commentApi'

/**
 * 댓글 섹션 컴포넌트
 * 댓글 목록, 작성, 수정, 삭제, 답글 기능을 제공
 */
function CommentSection({ communityId, currentUserId }) {
  const {
    // 데이터
    loading,
    currentPage,
    totalPages,
    totalComments,
    parentComments,
    getReplies,

    // 폼 상태
    commentText,
    setCommentText,
    replyingTo,
    setReplyingTo,
    replyText,
    setReplyText,
    editingId,
    editText,
    setEditText,
    submitting,

    // 액션
    handlePageChange,
    handleSubmitComment,
    handleSubmitReply,
    handleStartEdit,
    handleCancelEdit,
    handleSubmitEdit,
    handleDeleteComment,
    handleCancelReply,
    updateCommentLikeCount,

    // 유틸
    formatDate,
  } = useComments(communityId, currentUserId)

  // 펼친 답글 목록 관리
  const [expandedReplies, setExpandedReplies] = useState(new Set())
  
  // 책 선택 상태
  const [selectedBook, setSelectedBook] = useState(null)
  const [replySelectedBook, setReplySelectedBook] = useState(null)
  const [editSelectedBook, setEditSelectedBook] = useState(null)
  
  // 책 검색 모달 상태
  const [showBookModal, setShowBookModal] = useState(false)
  const [bookModalMode, setBookModalMode] = useState('comment')
  const [hashTriggerReady, setHashTriggerReady] = useState(false)
  const commentInputRef = useRef(null)

  // 북마크 상태
  const [bookmarkedBookIds, setBookmarkedBookIds] = useState(new Set())
  const [bookmarkLoading, setBookmarkLoading] = useState(null) // 로딩 중인 bookId

  // 댓글 좋아요 상태
  const [likedCommentIds, setLikedCommentIds] = useState(new Set())

  // 북마크 및 좋아요 목록 로드
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUserId) return
      try {
        // 북마크 목록 로드
        const bookmarkIds = await fetchBookmarkedBookIds(currentUserId)
        setBookmarkedBookIds(new Set(bookmarkIds))
        
        // 좋아요한 댓글 목록 로드
        const likeData = await fetchLikedCommentIds(currentUserId)
        setLikedCommentIds(new Set(likeData.likedCommentIds || []))
      } catch (err) {
        console.error('사용자 데이터 로딩 실패:', err)
      }
    }
    loadUserData()
  }, [currentUserId])

  // 북마크 토글
  const handleBookmark = async (book) => {
    if (!currentUserId) {
      alert('로그인이 필요합니다.')
      return
    }
    
    setBookmarkLoading(book.bookId)
    try {
      const result = await toggleBookmark(currentUserId, book.bookId)
      if (result.success) {
        setBookmarkedBookIds(prev => {
          const newSet = new Set(prev)
          if (result.bookmarked) {
            newSet.add(book.bookId)
          } else {
            newSet.delete(book.bookId)
          }
          return newSet
        })
      }
    } catch (err) {
      console.error('북마크 토글 실패:', err)
    } finally {
      setBookmarkLoading(null)
    }
  }

  // 답글 펼치기/접기
  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  // # 입력 감지
  const handleCommentInputChange = (e) => {
    const value = e.target.value
    setCommentText(value)
    if (value.endsWith('#') && !selectedBook) {
      setHashTriggerReady(true)
    } else if (!value.endsWith('#')) {
      setHashTriggerReady(false)
    }
  }

  // # + 스페이스로 모달 열기
  const handleCommentKeyDown = (e) => {
    const currentValue = e.target.value
    const endsWithHash = currentValue.endsWith('#')
    
    if ((hashTriggerReady || endsWithHash) && e.code === 'Space' && !selectedBook) {
      e.preventDefault()
      setShowBookModal(true)
      setHashTriggerReady(false)
      setCommentText(currentValue.slice(0, -1))
    }
  }

  // 책 선택 핸들러
  const handleBookSelectFromModal = (book) => {
    if (bookModalMode === 'comment') {
      setSelectedBook(book)
    } else if (bookModalMode === 'reply') {
      setReplySelectedBook(book)
    } else if (bookModalMode === 'edit') {
      setEditSelectedBook(book)
    }
  }

  // 모달 열기/닫기
  const openBookModal = (mode) => {
    setBookModalMode(mode)
    setShowBookModal(true)
  }
  const closeBookModal = () => setShowBookModal(false)

  // 수정 시작 (기존 책 정보 포함)
  const handleStartEditWithBook = (comment) => {
    handleStartEdit(comment)
    if (comment.bookId) {
      setEditSelectedBook({
        bookId: comment.bookId,
        title: comment.bookTitle,
        author: comment.bookAuthor,
        imageUrl: comment.bookImageUrl,
      })
    } else {
      setEditSelectedBook(null)
    }
  }

  // 수정 취소
  const handleCancelEditWithBook = () => {
    handleCancelEdit()
    setEditSelectedBook(null)
  }

  // 답글 취소
  const handleCancelReplyWithBook = () => {
    handleCancelReply()
    setReplySelectedBook(null)
  }

  // 댓글 제출
  const handleCommentSubmit = async (e) => {
    const success = await handleSubmitComment(e, selectedBook?.bookId || null)
    if (success) setSelectedBook(null)
  }

  // 수정 제출
  const handleEditSubmit = async (commentId) => {
    const success = await handleSubmitEdit(commentId, editSelectedBook?.bookId || null)
    if (success) setEditSelectedBook(null)
  }

  // 답글 제출
  const handleReplySubmit = async (parentId) => {
    const success = await handleSubmitReply(parentId, replySelectedBook?.bookId || null)
    if (success) setReplySelectedBook(null)
  }

  // 댓글 좋아요 토글
  const handleLikeComment = async (commentId) => {
    if (!currentUserId) {
      alert('로그인이 필요합니다.')
      return
    }
    
    try {
      const result = await toggleCommentLike(commentId, currentUserId)
      if (result.success && result.data) {
        // 좋아요 수 업데이트
        updateCommentLikeCount(commentId, result.data.likeCount)
        
        // 좋아요 상태 업데이트
        setLikedCommentIds(prev => {
          const newSet = new Set(prev)
          if (result.data.isLiked) {
            newSet.add(commentId)
          } else {
            newSet.delete(commentId)
          }
          return newSet
        })
      }
    } catch (err) {
      console.error('좋아요 실패:', err)
    }
  }

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
                onClick={() => setSelectedBook(null)}
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
                onRemoveEditBook={() => setEditSelectedBook(null)}
                onRemoveReplyBook={() => setReplySelectedBook(null)}
                onLike={handleLikeComment}
                likedCommentIds={likedCommentIds}
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

