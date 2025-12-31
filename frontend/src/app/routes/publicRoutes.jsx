// 로그인 없이 접근 가능한 페이지들
import BookPage from '@/feature/Book/pages/BookPage'
import NotFoundPage from '@/shared/pages/NotFoundPage'

const publicRoutes = [
  { path: '/', element: <BookPage /> },
  { path: '*', element: <NotFoundPage /> },
]

export default publicRoutes
