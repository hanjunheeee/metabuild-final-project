// 로그인 없이 접근 가능한 페이지들
import MainPage from '@/feature/Book/pages/MainPage'
import LoginPage from '@/feature/Login-Singup/pages/LoginPage'
import NotFoundPage from '@/shared/pages/NotFoundPage'

const publicRoutes = [
  { path: '/', element: <MainPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '*', element: <NotFoundPage /> },
]

export default publicRoutes
