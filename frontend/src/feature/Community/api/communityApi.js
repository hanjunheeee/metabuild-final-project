import { getAuthHeader } from '@/shared/api/authApi'

const BASE_URL = 'http://localhost:7878'

// 전체 커뮤니티 글 목록 조회
export const fetchCommunities = () => {
  return fetch(`${BASE_URL}/api/communities`).then(res => res.json())
}

// 커뮤니티 글 단건 조회
export const fetchCommunityById = (id) => {
  return fetch(`${BASE_URL}/api/communities/${id}`).then(res => res.json())
}

// Base64 이미지 업로드
export const uploadImage = async (imageData) => {
  const response = await fetch(`${BASE_URL}/api/community-images/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),  // JWT 토큰 추가
    },
    body: JSON.stringify({ imageData }),
  })
  return response.json()
}

// 커뮤니티 글 작성
export const createCommunity = async ({ userId, bookId, title, content, communityKind, thumbnailUrl, isNotice = 0 }) => {
  const response = await fetch(`${BASE_URL}/api/communities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),  // JWT 토큰 추가
    },
    body: JSON.stringify({
      userId,
      bookId,
      title,
      content,
      communityKind,
      thumbnailUrl,
      isNotice,
    }),
  })
  return response.json()
}

// 커뮤니티 글 삭제
export const deleteCommunity = async (communityId, userId) => {
  const response = await fetch(`${BASE_URL}/api/communities/${communityId}?userId=${userId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  })
  return response.json()
}

// 커뮤니티 글 수정
export const updateCommunity = async (communityId, { userId, bookId, title, content, communityKind, thumbnailUrl }) => {
  const response = await fetch(`${BASE_URL}/api/communities/${communityId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      userId,
      bookId,
      title,
      content,
      communityKind,
      thumbnailUrl,
    }),
  })
  return response.json()
}

// 좋아요 토글
export const likeCommunity = async (communityId, userId) => {
  const response = await fetch(`${BASE_URL}/api/communities/${communityId}/like?userId=${userId}`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
    },
  })
  return response.json()
}

// 좋아요 여부 확인
export const checkLike = async (communityId, userId) => {
  const response = await fetch(`${BASE_URL}/api/communities/${communityId}/like?userId=${userId}`, {
    headers: {
      ...getAuthHeader(),
    },
  })
  return response.json()
}

// 사용자가 좋아요한 게시글 ID 목록 조회
export const fetchLikedCommunityIds = async (userId) => {
  const response = await fetch(`${BASE_URL}/api/communities/liked/${userId}`, {
    headers: {
      ...getAuthHeader(),
    },
  })
  return response.json()
}

// 주간 HOT 게시글 조회
export const fetchHotPosts = async (limit = 5) => {
  const response = await fetch(`${BASE_URL}/api/communities/hot?limit=${limit}`)
  return response.json()
}

// HTML 콘텐츠에서 Base64 이미지를 찾아서 서버에 업로드하고 URL로 교체
export const processImagesInContent = async (htmlContent) => {
  // Base64 이미지 패턴 찾기
  const base64Pattern = /<img[^>]+src=["'](data:image\/[^;]+;base64,[^"']+)["'][^>]*>/g
  let processedContent = htmlContent
  let match

  const matches = []
  while ((match = base64Pattern.exec(htmlContent)) !== null) {
    matches.push({
      fullMatch: match[0],
      base64Data: match[1]
    })
  }

  // 각 Base64 이미지를 업로드하고 URL로 교체
  for (const { fullMatch, base64Data } of matches) {
    try {
      const result = await uploadImage(base64Data)
      if (result.success && result.imageUrl) {
        // Base64를 서버 URL로 교체
        const newImgTag = fullMatch.replace(base64Data, `${BASE_URL}${result.imageUrl}`)
        processedContent = processedContent.replace(fullMatch, newImgTag)
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
    }
  }

  return processedContent
}

