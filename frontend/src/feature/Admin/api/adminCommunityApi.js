const BASE_URL = ''

const getAuthHeader = () => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// 커뮤니티 글 삭제 (관리자용 - userId 없이)
export const deletePostByAdmin = async (communityId) => {
  const response = await fetch(`${BASE_URL}/api/communities/${communityId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  })
  if (!response.ok) {
    throw new Error('Failed to delete post')
  }
  return true
}

