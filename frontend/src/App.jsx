import { useRoutes } from 'react-router-dom'
import MainLayout from './app/layouts/MainLayout'
import { publicRoutes, privateRoutes } from './app/routes'

function App() {
  // TODO: 로그인(인증) 상태 확인 로직 추가
  const isAuthenticated = false

  // 라우트 설정 - MainLayout으로 감싸기
  const routes = [
    {
      path: '/',
      element: <MainLayout />,
      children: [
        ...publicRoutes,
        // 인증된 사용자만 접근 가능한 라우트
        ...(isAuthenticated ? privateRoutes : []),
      ],
    },
  ]

  const routing = useRoutes(routes)

  return routing
}

export default App
