// 로그인 없이 접근 가능한 페이지들
import HomePage from '@/feature/User/pages/HomePage'
import NotFoundPage from '@/shared/pages/NotFoundPage'

const publicRoutes = [
  { path: '/', element: <HomePage /> },
  { path: '*', element: <NotFoundPage /> },
]

export default publicRoutes

