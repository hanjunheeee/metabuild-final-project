import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="text-center py-16 animate-fade-in">
      <h2 className="text-5xl font-bold mb-6 text-gray-900">404</h2>
      <p className="text-gray-500 text-lg mb-8">페이지를 찾을 수 없습니다</p>
      <Link 
        to="/" 
        className="inline-block px-8 py-3 bg-main-bg text-white rounded-lg font-semibold hover:opacity-90 transition-all"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}

export default NotFoundPage
