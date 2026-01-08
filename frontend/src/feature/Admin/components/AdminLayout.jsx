import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { getUserFromSession } from '@/shared/api/authApi'

function AdminLayout() {
  const user = getUserFromSession()
  const navigate = useNavigate()

  const menuItems = [
    { path: '/admin', label: '관리자 대시보드', end: true },
    { path: '/admin/books', label: '도서 관리' },
    { path: '/admin/posts', label: '커뮤니티 게시글 관리' },
    { path: '/admin/notice', label: '공지 작성' },
    { path: '/admin/users', label: '회원 관리' },
  ]

  return (
    <div className="flex-1 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 상단 헤더 */}
        <div className="mb-6 text-left">
          <h1 className="text-2xl font-extrabold text-sub-bg mb-1">관리자 페이지</h1>
          <p className="text-gray-400 text-sm">
            {user?.nickname || '관리자'}님, 환영합니다.
          </p>
        </div>

        <div className="flex gap-6">
          {/* 좌측 사이드바 */}
          <aside className="w-56 flex-shrink-0">
            <nav className="bg-white border border-gray-200 shadow-sm sticky top-8">
              <div className="px-4 py-3 bg-gray-800 text-white text-sm font-medium">
                관리자 메뉴
              </div>
              <ul>
                {menuItems.map((item, index) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.end}
                      className={({ isActive }) =>
                        `block px-4 py-3 text-sm transition-colors border-l-2 ${
                          isActive
                            ? 'bg-gray-50 text-main-bg font-medium border-main-bg'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-transparent'
                        } ${index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''}`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* 우측 컨텐츠 영역 */}
          <main className="flex-1 min-w-0">
            <div className="bg-white border border-gray-200 shadow-sm p-6">
              <Outlet />
            </div>

            {/* 뒤로가기 버튼 */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-main-bg transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                뒤로가기
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout

