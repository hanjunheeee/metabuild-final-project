// 로그인 없이 접근 가능한 페이지들
import MainPage from '@/feature/Book/pages/MainPage'
import LoginPage from '@/feature/Login-Singup/pages/LoginPage'
import SignupPage from '@/feature/Login-Singup/pages/SignupPage'
import ForgotPasswordPage from '@/feature/Login-Singup/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/feature/Login-Singup/pages/ResetPasswordPage'
import SearchPage from '@/feature/Book/pages/SearchPage'
import NotFoundPage from '@/shared/pages/NotFoundPage'
import TermsPage from '@/shared/pages/TermsPage'
import PrivacyPage from '@/shared/pages/PrivacyPage'
import AboutPage from '@/shared/pages/AboutPage'
import CommunityListPage from '@/feature/Community/pages/CommunityListPage'
import CommunityDetailPage from '@/feature/Community/pages/CommunityDetailPage'
import LibraryMapPage from '@/feature/Library/pages/LibraryMapPage'

const publicRoutes = [
  { path: '/', element: <MainPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/searchbook', element: <SearchPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/community', element: <CommunityListPage /> },
  { path: '/community/:id', element: <CommunityDetailPage /> },
  { path: '/library/map', element: <LibraryMapPage /> },
  { path: '*', element: <NotFoundPage /> },
]

export default publicRoutes
