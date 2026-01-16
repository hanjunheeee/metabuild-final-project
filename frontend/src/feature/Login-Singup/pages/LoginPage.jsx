import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { InputField, PasswordInput, Button } from '@/shared/components'
import { login } from '@/shared/api/authApi'

function LoginPage({ isAdmin = false }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      const data = await login(email, password, rememberMe)
      
      // 관리자 로그인 페이지에서는 ADMIN만 허용
      if (isAdmin) {
        if (data.role === 'ADMIN') {
          navigate('/admin')
        } else {
          setError('관리자 권한이 없습니다.')
        }
      } else {
        // 일반 로그인: 역할에 따라 리다이렉트
        if (data.role === 'ADMIN') {
          navigate('/admin')
        } else {
          navigate('/')
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center py-8 px-4">
      {/* 로그인 카드 */}
      <div className="w-full max-w-sm border border-main-bg p-8 shadow-sm">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-sub-bg mb-2">
            {isAdmin ? '관리자 로그인' : '로그인'}
          </h1>
          <p className="text-gray-400 text-sm">
            {isAdmin ? '관리자 계정으로 로그인해주세요' : '계정 정보를 입력해주세요'}
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* 이메일 */}
          <InputField
            id="email"
            name="email"
            label={isAdmin ? '아이디' : '이메일'}
            type={isAdmin ? 'text' : 'email'}
            placeholder={isAdmin ? '관리자 아이디를 입력해 주세요.' : '이메일을 입력해 주세요.'}
            required
          />

          {/* 비밀번호 */}
          <PasswordInput
            id="password"
            name="password"
            label="비밀번호"
            required
            rightLink={
              !isAdmin && (
                <Link to="/forgot-password" className="text-xs text-sub-bg hover:text-main-bg">
                  비밀번호 찾기
                </Link>
              )
            }
          />

          {/* 로그인 유지 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 border-gray-300 bg-gray-50 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
            <label htmlFor="remember" className="text-sm text-gray-600">
              로그인 상태 유지
            </label>
          </div>

          {/* 로그인 버튼 */}
          <Button type="submit" isLoading={isLoading} loadingText="로그인 중...">
            로그인
          </Button>
        </form>

        {/* 회원가입 링크 - 관리자 로그인에서는 숨김 */}
        {!isAdmin && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="text-sub-bg hover:text-main-bg font-medium">
                회원가입
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginPage
