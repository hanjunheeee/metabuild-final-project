import { getAuthHeader } from './authApi'

const API_BASE_URL = 'http://localhost:7878'

/**
 * 팔로우/언팔로우 토글
 */
export const toggleFollow = async (followerId, followingId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/follow/toggle?followerId=${followerId}&followingId=${followingId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    }
  )
  return response.json()
}

/**
 * 팔로우 여부 확인
 */
export const checkFollowing = async (followerId, followingId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/follow/check?followerId=${followerId}&followingId=${followingId}`
  )
  return response.json()
}

/**
 * 팔로잉 목록 조회
 */
export const fetchFollowingList = async (userId, currentUserId) => {
  const url = currentUserId
    ? `${API_BASE_URL}/api/follow/following/${userId}?currentUserId=${currentUserId}`
    : `${API_BASE_URL}/api/follow/following/${userId}`
  const response = await fetch(url)
  return response.json()
}

/**
 * 팔로워 목록 조회
 */
export const fetchFollowersList = async (userId, currentUserId) => {
  const url = currentUserId
    ? `${API_BASE_URL}/api/follow/followers/${userId}?currentUserId=${currentUserId}`
    : `${API_BASE_URL}/api/follow/followers/${userId}`
  const response = await fetch(url)
  return response.json()
}

/**
 * 팔로잉/팔로워 수 조회
 */
export const fetchFollowCounts = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/follow/count/${userId}`)
  return response.json()
}

