import { Link } from 'react-router-dom'
import logo from '@/assets/image/logo.png'

function Header() {
  return (
    <header className="bg-white px-8 py-2 border-b border-gray-200">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="no-underline flex items-center gap-3">
          <img src={logo} alt="로고" className="w-[75px] h-[75px]" />
          <h1 className="text-2xl font-bold text-gray-900">
            빌릴수 e 서울
          </h1>
        </Link>
        <nav>
          <ul style={{ display: 'flex', listStyle: 'none', gap: '32px' }}>
            <li>
              <Link to="/login" className="text-gray-600 font-medium px-4 py-2 rounded hover:text-main-bg transition-all">
                로그인
              </Link>
            </li>
            <li>
              <Link to="/signup" className="text-gray-600 font-medium px-4 py-2 rounded hover:text-main-bg transition-all">
                회원가입
              </Link>
            </li>
            <li>
              <Link to="/mypage" className="text-gray-600 font-medium px-4 py-2 rounded hover:text-main-bg transition-all">
                마이페이지
              </Link>
            </li>
            <li>
              <Link to="/community" className="text-gray-600 font-medium px-4 py-2 rounded hover:text-main-bg transition-all">
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
