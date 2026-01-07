import { useRoutes } from 'react-router-dom'
import MainLayout from './app/layouts/MainLayout'
import { publicRoutes } from './app/routes'
import PrivateRoute from './app/routes/PrivateRoute'
import CommunityWritePage from '@/feature/Community/pages/CommunityWritePage'

// 마이페이지 컴포넌트
import MyPageLayout from '@/feature/Mypage/components/MyPageLayout'
import ProfilePage from '@/feature/Mypage/pages/ProfilePage'
import MyPostsPage from '@/feature/Mypage/pages/MyPostsPage'
import MyLikesPage from '@/feature/Mypage/pages/MyLikesPage'
import MyBookmarksPage from '@/feature/Mypage/pages/MyBookmarksPage'
import MyFollowingPage from '@/feature/Mypage/pages/MyFollowingPage'

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
            { path: 'posts', element: <MyPostsPage /> },
            { path: 'likes', element: <MyLikesPage /> },
            { path: 'bookmarks', element: <MyBookmarksPage /> },
            { path: 'following', element: <MyFollowingPage /> },
          ],
        },
      ],
    },
  ]

  const routing = useRoutes(routes)

  return routing
}

export default App
