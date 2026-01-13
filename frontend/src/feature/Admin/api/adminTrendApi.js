import { getAuthHeader } from '@/shared/api/authApi'

const BASE_URL = 'http://localhost:7878'

/**
 * 현재 트렌드 키워드 목록 조회
 */
export const fetchKeywordTrends = async () => {
  const res = await fetch(`${BASE_URL}/api/analytics/trends/keywords`)
  if (!res.ok) throw new Error('Failed to fetch keyword trends')
  return res.json()
}

/**
 * 차단된 키워드 목록 조회
 */
export const fetchBlockedKeywords = async () => {
  const res = await fetch(`${BASE_URL}/api/analytics/blocked-keywords`, {
    headers: {
      ...getAuthHeader(),
    },
  })
  if (!res.ok) throw new Error('Failed to fetch blocked keywords')
  return res.json()
}

/**
 * 키워드 차단 추가
 */
export const blockKeyword = async (keyword) => {
  const res = await fetch(`${BASE_URL}/api/analytics/blocked-keywords`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ keyword }),
  })
  return res.json()
}

/**
 * 키워드 차단 해제
 */
export const unblockKeyword = async (keyword) => {
  const res = await fetch(`${BASE_URL}/api/analytics/blocked-keywords/${encodeURIComponent(keyword)}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  })
  return res.json()
}

