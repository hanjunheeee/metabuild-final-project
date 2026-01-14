import { useState, useRef, useEffect } from 'react'
import useComments from './useComments'
import { fetchBookmarkedBookIds, toggleBookmark } from '@/shared/api/bookmarkApi'
import { toggleCommentLike, fetchLikedCommentIds } from '../api/commentApi'

const API_BASE_URL = 'http://localhost:7878'

/**
 * 댓글 섹션 전체 로직을 관리하는 훅
 * 댓글 CRUD, 북마크, 좋아요, 책 선택, 칭호 조회 등 모든 상태와 핸들러 포함
 */
function useCommentSection(communityId, currentUserId) {
  // 기본 댓글 CRUD 훅
  const {
    loading,
    currentPage,
    totalPages,
    totalComments,
    parentComments,
    getReplies,
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
    handlePageChange,
    handleSubmitComment,
    handleSubmitReply,
    handleStartEdit,
    handleCancelEdit,
    handleSubmitEdit,
    handleDeleteComment,
    handleCancelReply,
    updateCommentLikeCount,
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
  const [bookmarkLoading, setBookmarkLoading] = useState(null)

  // 댓글 좋아요 상태
  const [likedCommentIds, setLikedCommentIds] = useState(new Set())

  // 사용자별 칭호 캐시 (userId -> titles[])
  const [userTitles, setUserTitles] = useState({})

  // ========================================
  // Effects
  // ========================================

  // 북마크 및 좋아요 목록 로드
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUserId) return
      try {
        const bookmarkIds = await fetchBookmarkedBookIds(currentUserId)
        setBookmarkedBookIds(new Set(bookmarkIds))
        
        const likeData = await fetchLikedCommentIds(currentUserId)
        setLikedCommentIds(new Set(likeData.likedCommentIds || []))
      } catch (err) {
        console.error('사용자 데이터 로딩 실패:', err)
      }
    }
    loadUserData()
  }, [currentUserId])

  // 댓글 작성자들의 칭호 로드
  useEffect(() => {
    const loadUserTitles = async () => {
      const allUserIds = new Set()
      parentComments.forEach(comment => {
        if (comment.userId) allUserIds.add(comment.userId)
        const replies = getReplies(comment.commentId)
        replies.forEach(reply => {
          if (reply.userId) allUserIds.add(reply.userId)
        })
      })

      const newUserIds = [...allUserIds].filter(id => !userTitles[id])
      if (newUserIds.length === 0) return

      const titlesMap = { ...userTitles }
      await Promise.all(
        newUserIds.map(async (userId) => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/titles/user/${userId}/top`)
            const data = await res.json()
            titlesMap[userId] = data || []
          } catch (err) {
            console.error(`칭호 조회 실패 (userId: ${userId}):`, err)
            titlesMap[userId] = []
          }
        })
      )
      setUserTitles(titlesMap)
    }

    if (parentComments.length > 0) {
      loadUserTitles()
    }
  }, [parentComments, getReplies, userTitles])

  // ========================================
  // Handlers
  // ========================================

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
        updateCommentLikeCount(commentId, result.data.likeCount)
        
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

  // 책 제거 핸들러
  const removeSelectedBook = () => setSelectedBook(null)
  const removeEditBook = () => setEditSelectedBook(null)
  const removeReplyBook = () => setReplySelectedBook(null)

  return {
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
  }
}

export default useCommentSection

