// 로그인이 필요한 페이지들 (인증 필요)
import PrivateRoute from './PrivateRoute'
import CommunityWritePage from '@/feature/Community/pages/CommunityWritePage'

const privateRoutes = [
  { 
    path: '/community/write', 
    element: (
      <PrivateRoute>
        <CommunityWritePage />
      </PrivateRoute>
    )
  },
  // 예시:
  // { path: '/mypage', element: <PrivateRoute><MyPage /></PrivateRoute> },
]

export default privateRoutes

