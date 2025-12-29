import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="text-center py-16 animate-fade-in">
      <h2 className="text-5xl font-bold mb-6 text-cyan-400">404</h2>
      <p className="text-white/70 text-lg mb-8">페이지를 찾을 수 없습니다</p>
      <Link 
        to="/" 
        className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-900 rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/40 transition-all"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}

export default NotFoundPage
