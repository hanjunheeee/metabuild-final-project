import { useState } from 'react'
import useComments from '../hooks/useComments'
import Pagination from '@/shared/components/navigation/Pagination'

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

    // 유틸
    formatDate,
  } = useComments(communityId, currentUserId)

  // 펼친 답글 목록 관리 (commentId Set)
  const [expandedReplies, setExpandedReplies] = useState(new Set())

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
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="flex-1 px-4 py-2 border border-gray-300 focus:outline-none focus:border-main-bg text-sm"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="px-4 py-2 bg-main-bg text-white text-sm font-medium hover:bg-sub-bg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? '작성 중...' : '작성'}
            </button>
          </div>
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
            {parentComments.map((comment) => {
              const replies = getReplies(comment.commentId)
              const replyCount = replies.length
              const isExpanded = expandedReplies.has(comment.commentId)
              const isEditing = editingId === comment.commentId
              const isReplying = replyingTo === comment.commentId

              return (
                <div key={comment.commentId}>
                  {/* 부모 댓글 */}
                  <div className="p-4 bg-white border border-gray-200">
                    {/* 댓글 헤더 */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3">
                        {/* 프로필 이미지 */}
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                          {comment.userProfileImage ? (
                            <img 
                              src={`http://localhost:7878/uploads/profile/${comment.userProfileImage}`} 
                              alt={comment.userNickname}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-main-bg text-white text-sm font-bold">
                              {(comment.userNickname || '?')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        {/* 닉네임 + 시간 */}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-800">
                              {comment.userNickname || '익명'}
                            </span>
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
                            onClick={() => handleStartEdit(comment)}
                            className="text-xs text-gray-500 hover:text-main-bg cursor-pointer"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.commentId)}
                            className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 댓글 내용 또는 수정 폼 */}
                    {isEditing ? (
                      <div className="flex gap-2 pl-13">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 focus:outline-none focus:border-main-bg text-sm"
                          disabled={submitting}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSubmitEdit(comment.commentId)}
                          disabled={!editText.trim() || submitting}
                          className="px-3 py-1.5 bg-main-bg text-white text-xs font-medium hover:bg-opacity-90 disabled:opacity-50"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs hover:bg-gray-50"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 leading-relaxed pl-13">
                        {comment.content}
                      </p>
                    )}

                    {/* 답글 영역: 펼치기/접기 + 답글 달기 */}
                    {!isEditing && (
                      <div className="mt-3 pl-13 flex items-center gap-4">
                        {/* 답글 펼치기/접기 버튼 */}
                        {replyCount > 0 && (
                          <button
                            onClick={() => toggleReplies(comment.commentId)}
                            className="flex items-center gap-1 text-xs text-main-bg hover:underline cursor-pointer"
                          >
                            <span>{isExpanded ? '▼' : '▶'}</span>
                            <span>{replyCount}개의 답글</span>
                          </button>
                        )}

                        {/* 답글 달기 버튼 (로그인한 사용자만) */}
                        {currentUserId && !isReplying && (
                          <button
                            onClick={() => setReplyingTo(comment.commentId)}
                            className="text-xs text-gray-500 hover:text-main-bg cursor-pointer"
                          >
                            답글 달기
                          </button>
                        )}
                      </div>
                    )}

                    {/* 답글 작성 폼 */}
                    {isReplying && (
                      <div className="mt-3 pl-13 flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="답글을 입력하세요..."
                          className="flex-1 px-3 py-1.5 border border-gray-300 focus:outline-none focus:border-main-bg text-sm"
                          disabled={submitting}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSubmitReply(comment.commentId)}
                          disabled={!replyText.trim() || submitting}
                          className="px-3 py-1.5 bg-main-bg text-white text-xs font-medium hover:bg-opacity-90 disabled:opacity-50 cursor-pointer"
                        >
                          등록
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelReply}
                          className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs hover:bg-gray-50 cursor-pointer"
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 답글 목록 (펼쳐진 경우에만 표시) */}
                  {isExpanded && replies.map((reply) => {
                    const isReplyEditing = editingId === reply.commentId

                    return (
                      <div
                        key={reply.commentId}
                        className="ml-8 mt-2 p-4 bg-gray-50 border border-gray-200 border-l-4 border-l-main-bg"
                      >
                        {/* 답글 헤더 */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-3">
                            {/* 프로필 이미지 */}
                            <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                              {reply.userProfileImage ? (
                                <img 
                                  src={`http://localhost:7878/uploads/profile/${reply.userProfileImage}`} 
                                  alt={reply.userNickname}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-main-bg text-white text-xs font-bold">
                                  {(reply.userNickname || '?')[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                            {/* 닉네임 + 시간 */}
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium text-gray-800">
                                  {reply.userNickname || '익명'}
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
                          {currentUserId === reply.userId && !isReplyEditing && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleStartEdit(reply)}
                                className="text-xs text-gray-500 hover:text-main-bg cursor-pointer"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteComment(reply.commentId)}
                                className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 답글 내용 또는 수정 폼 */}
                        {isReplyEditing ? (
                          <div className="flex gap-2 pl-12">
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="flex-1 px-3 py-1.5 border border-gray-300 focus:outline-none focus:border-main-bg text-sm"
                              disabled={submitting}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSubmitEdit(reply.commentId)}
                              disabled={!editText.trim() || submitting}
                              className="px-3 py-1.5 bg-main-bg text-white text-xs font-medium hover:bg-opacity-90 disabled:opacity-50 cursor-pointer"
                            >
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs hover:bg-gray-50 cursor-pointer"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 leading-relaxed pl-12">
                            {reply.content}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
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
