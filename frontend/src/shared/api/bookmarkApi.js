import { getAuthHeader } from './authApi'

const API_BASE = '/api/bookmarks'

/**
 * 북마크 토글 (추가/삭제)
 */
export const toggleBookmark = async (userId, bookId) => {
  try {
    const response = await fetch(`${API_BASE}/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ userId, bookId })
    })
    return await response.json()
  } catch (error) {
    console.error('북마크 토글 실패:', error)
    throw error
  }
}

/**
 * 북마크 여부 확인
 */
export const checkBookmark = async (userId, bookId) => {
  try {
    const response = await fetch(`${API_BASE}/check?userId=${userId}&bookId=${bookId}`, {
      headers: {
        ...getAuthHeader()
      }
    })
    return await response.json()
  } catch (error) {
    console.error('북마크 확인 실패:', error)
    throw error
  }
}

/**
 * 사용자의 북마크 목록 조회
 */
export const fetchBookmarksByUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE}/user/${userId}`, {
      headers: {
        ...getAuthHeader()
      }
    })
    return await response.json()
  } catch (error) {
    console.error('북마크 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 사용자가 북마크한 책 ID 목록 조회
 */
export const fetchBookmarkedBookIds = async (userId) => {
  try {
    const response = await fetch(`${API_BASE}/user/${userId}/book-ids`, {
      headers: {
        ...getAuthHeader()
      }
    })
    return await response.json()
  } catch (error) {
    console.error('북마크 책 ID 목록 조회 실패:', error)
    throw error
  }
}

