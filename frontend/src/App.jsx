import { useRoutes } from 'react-router-dom'
import MainLayout from './app/layouts/MainLayout'
import { publicRoutes } from './app/routes'
import PrivateRoute from './app/routes/PrivateRoute'
import CommunityWritePage from '@/feature/Community/pages/CommunityWritePage'

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
      ],
    },
  ]

  const routing = useRoutes(routes)

  return routing
}

export default App
