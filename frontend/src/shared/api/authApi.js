const BASE_URL = 'http://localhost:7878'

// 스토리지 키
const TOKEN_KEY = 'token'
const USER_KEY = 'user'
const REMEMBER_KEY = 'rememberMe'

// 스토리지 선택 (rememberMe에 따라 localStorage 또는 sessionStorage)
const getStorage = (rememberMe) => {
  return rememberMe ? localStorage : sessionStorage
}

// 현재 사용 중인 스토리지 확인 (localStorage 우선)
const getCurrentStorage = () => {
  if (localStorage.getItem(TOKEN_KEY)) return localStorage
  if (sessionStorage.getItem(TOKEN_KEY)) return sessionStorage
  return null
}

// 회원가입
export const signup = async (email, password, nickname, userPhoto = null, captchaToken = null) => {
  const response = await fetch(`${BASE_URL}/api/users/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, nickname, userPhoto, captchaToken }),
  })

  if (!response.ok) {
    const errorMessage = await response.text()
    throw new Error(errorMessage || '회원가입에 실패했습니다.')
  }

  return await response.json()
}

// 로그인 (JWT 토큰 발급)
export const login = async (email, password, rememberMe = false) => {
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
  
  // rememberMe 설정 저장 (어떤 스토리지를 사용했는지 기억)
  if (rememberMe) {
    localStorage.setItem(REMEMBER_KEY, 'true')
  } else {
    localStorage.removeItem(REMEMBER_KEY)
  }
  
  // 토큰과 사용자 정보 저장
  saveToken(data.token, rememberMe)
  saveUserToSession({
    userId: data.userId,
    email: data.email,
    nickname: data.nickname,
    role: data.role,
    userPhoto: data.userPhoto,
  }, rememberMe)
  
  return data
}

// 토큰 저장
export const saveToken = (token, rememberMe = false) => {
  const storage = getStorage(rememberMe)
  storage.setItem(TOKEN_KEY, token)
}

// 토큰 가져오기 (localStorage 우선 확인)
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

// 세션에 사용자 정보 저장
export const saveUserToSession = (user, rememberMe = false) => {
  const storage = getStorage(rememberMe)
  storage.setItem(USER_KEY, JSON.stringify(user))
  // 같은 탭에서도 Header가 감지할 수 있도록 커스텀 이벤트 발생
  window.dispatchEvent(new Event('authChange'))
}

// 세션에서 사용자 정보 가져오기 (localStorage 우선 확인)
export const getUserFromSession = () => {
  const user = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

// 로그아웃 (양쪽 스토리지 모두 삭제)
export const logout = () => {
  // localStorage 정리
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(REMEMBER_KEY)
  // sessionStorage 정리
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  // 같은 탭에서도 Header가 감지할 수 있도록 커스텀 이벤트 발생
  window.dispatchEvent(new Event('authChange'))
}

// 로그인 상태 확인
export const isLoggedIn = () => {
  return getToken() !== null
}

// 로그인 상태 유지 여부 확인
export const isRememberMe = () => {
  return localStorage.getItem(REMEMBER_KEY) === 'true'
}

// 인증 헤더 가져오기 (API 호출 시 사용)
export const getAuthHeader = () => {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// 프로필 수정
export const updateProfile = async (userId, nickname, userPhoto) => {
  const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ nickname, userPhoto }),
  })

  if (!response.ok) {
    const errorMessage = await response.text()
    throw new Error(errorMessage || '프로필 수정에 실패했습니다.')
  }

  const data = await response.json()

  if (data.success) {
    // 세션 정보 업데이트 (현재 사용 중인 스토리지 유지)
    const currentUser = getUserFromSession()
    const rememberMe = isRememberMe()
    saveUserToSession({
      ...currentUser,
      nickname: data.user.nickname,
      userPhoto: data.user.userPhoto,
    }, rememberMe)
  }

  return data
}

// 프로필 사진 업로드
export const uploadProfilePhoto = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${BASE_URL}/api/files/upload/profile`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('프로필 사진 업로드에 실패했습니다.')
  }

  return await response.json()
}
