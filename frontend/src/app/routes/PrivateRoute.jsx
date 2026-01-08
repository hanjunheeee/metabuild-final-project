import { Navigate, useLocation } from 'react-router-dom'
import { getToken, getUserFromSession } from '@/shared/api/authApi'

/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 * JWT 토큰이 없으면 로그인 페이지로 리다이렉트
 * requiredRole이 있으면 해당 권한도 체크
 */
function PrivateRoute({ children, requiredRole }) {
  const location = useLocation()
  const token = getToken()
  const currentUser = getUserFromSession()

  if (!token) {
    // 로그인 후 원래 가려던 페이지로 돌아갈 수 있도록 state에 저장
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // 관리자 권한이 필요한데 ADMIN이 아닌 경우
  if (requiredRole === 'ADMIN' && currentUser?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return children
}

export default PrivateRoute

