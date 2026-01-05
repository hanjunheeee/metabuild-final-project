import { Navigate, useLocation } from 'react-router-dom'
import { getToken } from '@/shared/api/authApi'

/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 * JWT 토큰이 없으면 로그인 페이지로 리다이렉트
 */
function PrivateRoute({ children }) {
  const location = useLocation()
  const token = getToken()

  if (!token) {
    // 로그인 후 원래 가려던 페이지로 돌아갈 수 있도록 state에 저장
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}

export default PrivateRoute

