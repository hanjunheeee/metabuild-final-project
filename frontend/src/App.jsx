import { useRoutes } from 'react-router-dom'
import MainLayout from './app/layouts/MainLayout'
import { publicRoutes } from './app/routes'
import PrivateRoute from './app/routes/PrivateRoute'
import CommunityWritePage from '@/feature/Community/pages/CommunityWritePage'

import ChatBot from './ai/components/ChatBot'

// 마이페이지 컴포넌트
import MyPageLayout from '@/feature/Mypage/components/MyPageLayout'
import ProfilePage from '@/feature/Mypage/pages/ProfilePage'
import MyPostsPage from '@/feature/Mypage/pages/MyPostsPage'
import MyLikesPage from '@/feature/Mypage/pages/MyLikesPage'
import MyBookmarksPage from '@/feature/Mypage/pages/MyBookmarksPage'
import MyFollowingPage from '@/feature/Mypage/pages/MyFollowingPage'
import ChangePasswordPage from '@/feature/Mypage/pages/ChangePasswordPage'
import TitleHistoryPage from '@/feature/Mypage/pages/TitleHistoryPage'

// 관리자 페이지 컴포넌트
import AdminLayout from '@/feature/Admin/components/AdminLayout'
import AdminDashboardPage from '@/feature/Admin/pages/AdminDashboardPage'
import BookManagePage from '@/feature/Admin/pages/BookManagePage'
import PostManagePage from '@/feature/Admin/pages/PostManagePage'
import NoticeWritePage from '@/feature/Admin/pages/NoticeWritePage'
import UserManagePage from '@/feature/Admin/pages/UserManagePage'
import UserDetailPage from '@/feature/Admin/pages/UserDetailPage'
import TrendManagePage from '@/feature/Admin/pages/TrendManagePage'

function App() {
  const routes = [
    {
      path: '/',
      element: <MainLayout />,
      children: [
        ...publicRoutes,
        // 로그인 필요한 페이지들
        { 
          path: '/community/write', 
          element: <PrivateRoute><CommunityWritePage /></PrivateRoute> 
        },
        // 마이페이지 (로그인 필요, 중첩 라우팅)
        {
          path: '/mypage',
          element: <PrivateRoute><MyPageLayout /></PrivateRoute>,
          children: [
            { index: true, element: <ProfilePage /> },
            { path: 'profile', element: <ProfilePage /> },
            { path: 'titles', element: <TitleHistoryPage /> },
            { path: 'change-password', element: <ChangePasswordPage /> },
            { path: 'posts', element: <MyPostsPage /> },
            { path: 'likes', element: <MyLikesPage /> },
            { path: 'bookmarks', element: <MyBookmarksPage /> },
            { path: 'following', element: <MyFollowingPage /> },
          ],
        },
        // 관리자 페이지 (관리자 권한 필요, 중첩 라우팅)
        {
          path: '/admin',
          element: <PrivateRoute requiredRole="ADMIN"><AdminLayout /></PrivateRoute>,
          children: [
            { index: true, element: <AdminDashboardPage /> },
            { path: 'books', element: <BookManagePage /> },
            { path: 'posts', element: <PostManagePage /> },
            { path: 'notice', element: <NoticeWritePage /> },
            { path: 'users', element: <UserManagePage /> },
            { path: 'users/:userId', element: <UserDetailPage /> },
            { path: 'trends', element: <TrendManagePage /> },
          ],
        },
      ],
    },
  ]

  const routing = useRoutes(routes)

  // 핵심 수정 부분: routing 결과와 ChatBot을 함께 반환합니다.
    return (
      <>
        {routing}
        <ChatBot />
      </>
    )
}

export default App
