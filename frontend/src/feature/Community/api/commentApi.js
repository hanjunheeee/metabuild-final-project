import { getAuthHeader } from '@/shared/api/authApi'

const BASE_URL = 'http://localhost:7878'

// 특정 게시글의 댓글 목록 조회 (전체)
export const fetchCommentsByCommunityId = async (communityId) => {
  const response = await fetch(`${BASE_URL}/api/comments/community/${communityId}`)
  return response.json()
}

// 특정 게시글의 댓글 목록 페이징 조회
export const fetchCommentsByCommunityIdPaged = async (communityId, page = 0, size = 5) => {
  const response = await fetch(
    `${BASE_URL}/api/comments/community/${communityId}/paged?page=${page}&size=${size}`
  )
  return response.json()
}

// 특정 사용자의 댓글 목록 조회
export const fetchCommentsByUserId = async (userId) => {
  const response = await fetch(`${BASE_URL}/api/comments/user/${userId}`)
  return response.json()
}

// 댓글 작성 (parentId가 있으면 답글, bookId는 책 태그)
export const createComment = async ({ communityId, userId, content, parentId = null, bookId = null }) => {
  const response = await fetch(`${BASE_URL}/api/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ communityId, userId, content, parentId, bookId }),
  })
  return response.json()
}

// 댓글 수정 (책 태그 수정 가능)
export const updateComment = async (commentId, userId, content, bookId = null) => {
  const response = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ userId, content, bookId }),
  })
  return response.json()
}

// 댓글 삭제
export const deleteComment = async (commentId, userId) => {
  const response = await fetch(`${BASE_URL}/api/comments/${commentId}?userId=${userId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  })
  return response.json()
}

// 댓글 좋아요 토글 (좋아요/취소)
export const toggleCommentLike = async (commentId, userId) => {
  const response = await fetch(`${BASE_URL}/api/comments/${commentId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ userId }),
  })
  return response.json()
}

// 특정 사용자가 좋아요한 댓글 ID 목록 조회
export const fetchLikedCommentIds = async (userId) => {
  const response = await fetch(`${BASE_URL}/api/comments/user/${userId}/liked`)
  return response.json()
}

// 특정 사용자가 받은 총 댓글 좋아요 수 조회
export const fetchTotalLikesByUserId = async (userId) => {
  const response = await fetch(`${BASE_URL}/api/comments/user/${userId}/total-likes`)
  return response.json()
}

