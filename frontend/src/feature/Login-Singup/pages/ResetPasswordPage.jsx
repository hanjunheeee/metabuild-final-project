import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { PasswordInput, Button } from '@/shared/components'

const API_BASE_URL = 'http://localhost:7878'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  // 토큰 유효성 검증
  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) {
        setIsTokenValid(false)
        setIsVerifying(false)
        setMessage('잘못된 접근입니다.')
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/verify-reset-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token })
        })
        const data = await response.json()

        setIsTokenValid(data.success)
        if (!data.success) {
          setMessage('유효하지 않거나 만료된 링크입니다. 비밀번호 찾기를 다시 시도해주세요.')
        }
      } catch {
        setIsTokenValid(false)
        setMessage('서버 오류가 발생했습니다.')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [token, email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    // 비밀번호 검증
    if (password.length < 8) {
      setMessage('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    if (password !== passwordConfirm) {
      setMessage('비밀번호가 일치하지 않습니다.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: password })
      })
      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
        setMessage('비밀번호가 성공적으로 변경되었습니다.')
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setMessage(data.message || '비밀번호 변경에 실패했습니다.')
      }
    } catch {
      setMessage('서버 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 로딩 중
  if (isVerifying) {
    return (
      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main-bg mx-auto mb-4"></div>
          <p className="text-gray-500">링크 확인 중...</p>
        </div>
      </div>
    )
  }

  // 토큰 무효
  if (!isTokenValid && !isSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-sm border border-main-bg p-8 shadow-sm text-center">
          <div className="text-red-500 text-5xl mb-4">⚠</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">링크가 유효하지 않습니다</h1>
          <p className="text-gray-500 text-sm mb-6">{message}</p>
          <Link 
            to="/forgot-password" 
            className="inline-block px-4 py-2 bg-main-bg text-white hover:bg-sub-bg transition-colors"
          >
            비밀번호 찾기 다시 시도
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-sm border border-main-bg p-8 shadow-sm">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-sub-bg mb-2">비밀번호 재설정</h1>
          <p className="text-gray-400 text-sm">
            새로운 비밀번호를 입력해주세요.
          </p>
        </div>

        {/* 성공 메시지 */}
        {isSuccess ? (
          <div className="text-center">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
              {message}
            </div>
            <p className="text-gray-500 text-sm">
              잠시 후 로그인 페이지로 이동합니다...
            </p>
          </div>
        ) : (
          <>
            {/* 에러 메시지 */}
            {message && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
                {message}
              </div>
            )}

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <PasswordInput
                id="password"
                name="password"
                label="새 비밀번호"
                placeholder="8자 이상 입력해 주세요."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <PasswordInput
                id="passwordConfirm"
                name="passwordConfirm"
                label="비밀번호 확인"
                placeholder="비밀번호를 다시 입력해 주세요."
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />

              <Button type="submit" isLoading={isLoading} loadingText="변경 중...">
                비밀번호 변경
              </Button>
            </form>

            {/* 로그인 링크 */}
            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-gray-400 hover:text-sub-bg">
                ← 로그인으로 돌아가기
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage

