import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components'
import { TextInput, InputLabel, ValidationMessage } from '../components'

const API_BASE_URL = ''

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setIsLoading(true)

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setMessage('올바른 이메일 형식이 아닙니다.')
      setIsSuccess(false)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
        setMessage('비밀번호 재설정 링크가 이메일로 발송되었습니다. 이메일을 확인해주세요.')
      } else {
        setIsSuccess(false)
        setMessage(data.message || '이메일 발송에 실패했습니다.')
      }
    } catch {
      setIsSuccess(false)
      setMessage('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-sm border border-main-bg p-8 shadow-sm">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-sub-bg mb-2">비밀번호 찾기</h1>
          <p className="text-gray-400 text-sm">
            가입하신 이메일 주소를 입력해주세요.<br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        {/* 성공 메시지 */}
        {isSuccess ? (
          <div className="text-center">
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
              {message}
            </div>
            <Link 
              to="/login" 
              className="text-sub-bg hover:text-main-bg font-medium"
            >
              로그인 페이지로 돌아가기
            </Link>
          </div>
        ) : (
          <>
            {/* 에러 메시지 */}
            {message && !isSuccess && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
                {message}
              </div>
            )}

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <InputLabel htmlFor="email">이메일</InputLabel>
                <TextInput
                  id="email"
                  name="email"
                  type="email"
                  placeholder="가입하신 이메일을 입력해 주세요."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <Button type="submit" isLoading={isLoading} loadingText="발송 중...">
                재설정 링크 발송
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

export default ForgotPasswordPage

