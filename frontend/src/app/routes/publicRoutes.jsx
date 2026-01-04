// 로그인 없이 접근 가능한 페이지들
import MainPage from '@/feature/Book/pages/MainPage'
import LoginPage from '@/feature/Login-Singup/pages/LoginPage'
import SignupPage from '@/feature/Login-Singup/pages/SignupPage'
import NotFoundPage from '@/shared/pages/NotFoundPage'
import TermsPage from '@/shared/pages/TermsPage'
import PrivacyPage from '@/shared/pages/PrivacyPage'
import AboutPage from '@/shared/pages/AboutPage'

const publicRoutes = [
  { path: '/', element: <MainPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '*', element: <NotFoundPage /> },
]

export default publicRoutes
