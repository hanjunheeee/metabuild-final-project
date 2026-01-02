import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import logo from '@/assets/image/logo2_nukki.png'
import { getUserFromSession, logout } from '@/shared/api/authApi'

function Header() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  // 세션에서 사용자 정보 확인
  useEffect(() => {
    const checkUser = () => {
      const sessionUser = getUserFromSession()
      setUser(sessionUser)
    }
    
    checkUser()
    
    // storage 이벤트 감지 (다른 탭에서 로그인/로그아웃 시)
    window.addEventListener('storage', checkUser)
    // 커스텀 이벤트 감지 (같은 탭에서 로그인/로그아웃 시)
    window.addEventListener('authChange', checkUser)
    
    return () => {
      window.removeEventListener('storage', checkUser)
      window.removeEventListener('authChange', checkUser)
    }
  }, [])

  // 로그아웃 처리
  const handleLogout = () => {
    logout()
    setUser(null)
    navigate('/')
  }

  return (
    <header className="bg-gray-50 px-8 border-b border-main-bg">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="no-underline flex items-center gap-3">
          <img src={logo} alt="로고" className="w-[100px] h-[100px]" />
          <h1 className="text-2xl font-extrabold text-sub-bg">
            빌릴수e서울
          </h1>
        </Link>
        <nav>
          <ul style={{ display: 'flex', listStyle: 'none', gap: '32px', alignItems: 'center' }}>
            {user ? (
              // 로그인 상태
              <>
                <li>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 font-medium px-4 py-2 rounded hover:text-main-bg transition-all cursor-pointer bg-transparent border-none"
                  >
                    로그아웃
                  </button>
                </li>
                <li>
                  <Link to="/mypage" className="text-gray-600 font-medium px-4 py-2 rounded hover:text-main-bg transition-all">
                    마이페이지
                  </Link>
                </li>
              </>
            ) : (
              // 비로그인 상태
              <>
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
              </>
            )}
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
