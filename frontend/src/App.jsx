import { useRoutes } from 'react-router-dom'
import MainLayout from './app/layouts/MainLayout'
import { publicRoutes, privateRoutes } from './app/routes'

function App() {
  // 라우트 설정
  // privateRoutes는 PrivateRoute 컴포넌트로 감싸져 있어서
  // 내부에서 인증 체크 후 리다이렉트 처리함
  const routes = [
    {
      path: '/',
      element: <MainLayout />,
      children: [
        ...publicRoutes,
        ...privateRoutes,
      ],
    },
  ]

  const routing = useRoutes(routes)

  return routing
}

export default App
