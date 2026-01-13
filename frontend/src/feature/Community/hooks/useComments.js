import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  fetchCommentsByCommunityIdPaged, 
  createComment, 
  updateComment, 
  deleteComment 
} from '../api/commentApi'

/**
 * 댓글 관리 훅
 * @param {number} communityId - 게시글 ID
 * @param {number} currentUserId - 현재 로그인한 사용자 ID
 * @param {number} pageSize - 페이지당 댓글 수 (기본: 10)
 */
function useComments(communityId, currentUserId, pageSize = 10) {
  // 데이터 상태
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalComments, setTotalComments] = useState(0)

  // 폼 상태
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 댓글 목록 로드
  const loadComments = useCallback(async (page) => {
    try {
      setLoading(true)
      const data = await fetchCommentsByCommunityIdPaged(communityId, page - 1, pageSize)
      setComments(data.comments || [])
      setCurrentPage(data.currentPage || 1)
      setTotalPages(data.totalPages || 1)
      setTotalComments(data.totalComments || 0)
    } catch (err) {
      console.error('댓글 로딩 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [communityId, pageSize])

  // 초기 로드 및 페이지 변경 시 로드
  useEffect(() => {
    if (communityId) {
      loadComments(currentPage)
    }
  }, [communityId, currentPage, loadComments])

  // 페이지 변경
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page)
  }, [])

  // 댓글 작성 (bookId 옵션)
  const handleSubmitComment = useCallback(async (e, bookId = null) => {
    e?.preventDefault()
    if (!commentText.trim() || !currentUserId) return

    try {
      setSubmitting(true)
      const payload = {
        communityId,
        userId: currentUserId,
        content: commentText.trim(),
      }
      // bookId가 있으면 추가 (백엔드 준비 시 사용)
      if (bookId) {
        payload.bookId = bookId
      }
      const result = await createComment(payload)
      if (result.success) {
        setCommentText('')
        setCurrentPage(1)
        await loadComments(1)
        return true // 성공 시 true 반환
      } else {
        alert(result.message || '댓글 작성에 실패했습니다.')
        return false
      }
    } catch (err) {
      console.error('댓글 작성 실패:', err)
      alert('댓글 작성에 실패했습니다.')
      return false
    } finally {
      setSubmitting(false)
    }
  }, [commentText, currentUserId, communityId, loadComments])

  // 답글 작성 (bookId 옵션)
  const handleSubmitReply = useCallback(async (parentId, bookId = null) => {
    if (!replyText.trim() || !currentUserId) return false

    try {
      setSubmitting(true)
      const payload = {
        communityId,
        userId: currentUserId,
        content: replyText.trim(),
        parentId,
      }
      if (bookId) {
        payload.bookId = bookId
      }
      const result = await createComment(payload)
      if (result.success) {
        setReplyText('')
        setReplyingTo(null)
        await loadComments(currentPage)
        return true
      } else {
        alert(result.message || '답글 작성에 실패했습니다.')
        return false
      }
    } catch (err) {
      console.error('답글 작성 실패:', err)
      alert('답글 작성에 실패했습니다.')
      return false
    } finally {
      setSubmitting(false)
    }
  }, [replyText, currentUserId, communityId, currentPage, loadComments])

  // 수정 시작
  const handleStartEdit = useCallback((comment) => {
    setEditingId(comment.commentId)
    setEditText(comment.content)
    setReplyingTo(null)
    setReplyText('')
  }, [])

  // 수정 취소
  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditText('')
  }, [])

  // 수정 제출 (bookId 옵션)
  const handleSubmitEdit = useCallback(async (commentId, bookId = null) => {
    if (!editText.trim() || !currentUserId) return false

    try {
      setSubmitting(true)
      const result = await updateComment(commentId, currentUserId, editText.trim(), bookId)
      if (result.success) {
        setEditingId(null)
        setEditText('')
        await loadComments(currentPage)
        return true
      } else {
        alert(result.message || '댓글 수정에 실패했습니다.')
        return false
      }
    } catch (err) {
      console.error('댓글 수정 실패:', err)
      alert('댓글 수정에 실패했습니다.')
      return false
    } finally {
      setSubmitting(false)
    }
  }, [editText, currentUserId, currentPage, loadComments])

  // 삭제
  const handleDeleteComment = useCallback(async (commentId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const result = await deleteComment(commentId, currentUserId)
      if (result.success) {
        await loadComments(currentPage)
      } else {
        alert(result.message || '댓글 삭제에 실패했습니다.')
      }
    } catch (err) {
      console.error('댓글 삭제 실패:', err)
      alert('댓글 삭제에 실패했습니다.')
    }
  }, [currentUserId, currentPage, loadComments])

  // 답글 작성 취소
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null)
    setReplyText('')
  }, [])

  // 부모 댓글만 필터
  const parentComments = useMemo(() => 
    comments.filter(c => !c.parentId), 
    [comments]
  )

  // 특정 부모의 답글 찾기
  const getReplies = useCallback((parentId) => 
    comments.filter(c => c.parentId === parentId), 
    [comments]
  )

  // 날짜 포맷
  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  // 좋아요 수 로컬 업데이트 (API 호출 후 사용)
  const updateCommentLikeCount = useCallback((commentId, newLikeCount) => {
    setComments(prev => prev.map(c => 
      c.commentId === commentId 
        ? { ...c, likeCount: newLikeCount }
        : c
    ))
  }, [])

  return {
    // 데이터
    comments,
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
  }
}

export default useComments

