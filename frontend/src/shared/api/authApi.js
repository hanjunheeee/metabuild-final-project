const BASE_URL = 'http://localhost:7878'

// 회원가입
export const signup = async (email, password, nickname, userPhoto = null) => {
  const response = await fetch(`${BASE_URL}/api/users/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, nickname, userPhoto }),
  })

  if (!response.ok) {
    const errorMessage = await response.text()
    throw new Error(errorMessage || '회원가입에 실패했습니다.')
  }

  return await response.json()
}

// 로그인 (JWT 토큰 발급)
export const login = async (email, password) => {
  const response = await fetch(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const errorMessage = await response.text()
    throw new Error(errorMessage || '로그인에 실패했습니다.')
  }

  const data = await response.json()
  
  // 토큰과 사용자 정보 저장
  saveToken(data.token)
  saveUserToSession({
    userId: data.userId,
    email: data.email,
    nickname: data.nickname,
    role: data.role,
  })
  
  return data
}

// 토큰 저장
export const saveToken = (token) => {
  sessionStorage.setItem('token', token)
}

// 토큰 가져오기
export const getToken = () => {
  return sessionStorage.getItem('token')
}

// 세션에 사용자 정보 저장
export const saveUserToSession = (user) => {
  sessionStorage.setItem('user', JSON.stringify(user))
  // 같은 탭에서도 Header가 감지할 수 있도록 커스텀 이벤트 발생
  window.dispatchEvent(new Event('authChange'))
}

// 세션에서 사용자 정보 가져오기
export const getUserFromSession = () => {
  const user = sessionStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

// 로그아웃 (토큰 + 세션 삭제)
export const logout = () => {
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  // 같은 탭에서도 Header가 감지할 수 있도록 커스텀 이벤트 발생
  window.dispatchEvent(new Event('authChange'))
}

// 로그인 상태 확인
export const isLoggedIn = () => {
  return getToken() !== null
}

// 인증 헤더 가져오기 (API 호출 시 사용)
export const getAuthHeader = () => {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
