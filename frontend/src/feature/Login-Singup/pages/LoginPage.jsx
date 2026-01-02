import { useState } from 'react'
import { Link } from 'react-router-dom'

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = (e) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <div className="flex-1 flex items-center justify-center py-8 px-4">
      {/* 로그인 카드 */}
      <div className="w-full max-w-sm border border-main-bg rounded-xl p-8 shadow-sm">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-sub-bg mb-2">로그인</h1>
          <p className="text-gray-400 text-sm">계정 정보를 입력해주세요</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* 이메일 */}
          <div>
            <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
              이메일
            </label>
            <input
              id="email"
              type="email"
              placeholder="이메일을 입력해 주세요."
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-sub-bg"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="text-sm text-gray-700">
                비밀번호
              </label>
              <Link to="#" className="text-xs text-sub-bg hover:text-main-bg">
                비밀번호 찾기
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 pr-16 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-sub-bg"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                {showPassword ? '숨기기' : '보기'}
              </button>
            </div>
          </div>

          {/* 로그인 유지 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              className="w-4 h-4 rounded border-gray-300 bg-gray-50 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
            <label htmlFor="remember" className="text-sm text-gray-600">
              로그인 상태 유지
            </label>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-main-bg cursor-pointer hover:opacity-90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                로그인 중...
              </span>
            ) : (
              '로그인'
            )}
          </button>
        </form>

        {/* 회원가입 링크 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            계정이 없으신가요?{' '}
            <Link to="/signup" className="text-sub-bg hover:text-main-bg font-medium">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
