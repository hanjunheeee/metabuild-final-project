import { getAuthHeader } from '@/shared/api/authApi'

const BASE_URL = 'http://localhost:7878'

/**
 * 전체 회원 목록 조회
 */
export const fetchUsers = async () => {
  const res = await fetch(`${BASE_URL}/api/users`)
  return res.json()
}

/**
 * 회원 활성/비활성 상태 변경
 * @param {number} userId - 사용자 ID
 * @param {string} isActive - 'Y' 또는 'N'
 */
export const updateUserStatus = async (userId, isActive) => {
  const res = await fetch(`${BASE_URL}/api/users/${userId}/status`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()  // JWT 토큰 추가
    },
    body: JSON.stringify({ isActive })
  })
  
  // 응답 텍스트 먼저 확인
  const text = await res.text()
  if (!text) {
    return { success: res.ok, message: res.ok ? '상태가 변경되었습니다.' : '상태 변경에 실패했습니다.' }
  }
  
  try {
    return JSON.parse(text)
  } catch {
    return { success: res.ok, message: text }
  }
}

