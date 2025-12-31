import { Link } from 'react-router-dom'
import logo from '@/assets/image/logo.png'

function Header() {
  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-4 border-b border-cyan-500/20">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="no-underline flex items-center gap-3">
          <img src={logo} alt="로고" className="w-[100px] h-[100px]" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
            MetaBuild
          </h1>
        </Link>
        <nav>
          <ul style={{ display: 'flex', listStyle: 'none', gap: '32px' }}>
            <li>
              <Link to="/login" className="text-white/80 font-medium px-4 py-2 rounded hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                로그인
              </Link>
            </li>
            <li>
              <Link to="/signup" className="text-white/80 font-medium px-4 py-2 rounded hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                회원가입
              </Link>
            </li>
            <li>
              <Link to="/mypage" className="text-white/80 font-medium px-4 py-2 rounded hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                마이페이지
              </Link>
            </li>
            <li>
              <Link to="/community" className="text-white/80 font-medium px-4 py-2 rounded hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                도서커뮤니티
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header
