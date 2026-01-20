import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PasswordInput } from '@/shared/components'
import { getUserFromSession, getAuthHeader } from '@/shared/api/authApi'

const API_BASE_URL = ''

function ChangePasswordPage() {
  const navigate = useNavigate()
  const currentUser = getUserFromSession()
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const errorRef = useRef(null)

  const scrollToError = useCallback(() => {
    setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 유효성 검사
    if (!currentPassword.trim()) {
      setError('현재 비밀번호를 입력해주세요.')
      scrollToError()
      return
    }

    if (!newPassword.trim()) {
      setError('새 비밀번호를 입력해주세요.')
      scrollToError()
      return
    }

    if (newPassword.length < 8) {
      setError('새 비밀번호는 8자 이상이어야 합니다.')
      scrollToError()
      return
    }

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.')
      scrollToError()
      return
    }

    if (currentPassword === newPassword) {
      setError('현재 비밀번호와 새 비밀번호가 같습니다.')
      scrollToError()
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          userId: currentUser.userId,
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/mypage/profile')
        }, 2000)
      } else {
        setError(data.message || '비밀번호 변경에 실패했습니다.')
        scrollToError()
      }
    } catch (err) {
      console.error('비밀번호 변경 실패:', err)
      setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      scrollToError()
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/mypage/profile')
  }

  // 성공 화면
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">비밀번호 변경 완료</h2>
        <p className="text-gray-500 text-sm">잠시 후 프로필 페이지로 이동합니다...</p>
      </div>
    )
  }

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">비밀번호 변경</h2>
        <p className="text-gray-400 text-sm mt-1">
          보안을 위해 현재 비밀번호를 확인한 후 새 비밀번호를 설정합니다.
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div ref={errorRef} className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 비밀번호 변경 폼 */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 현재 비밀번호 */}
        <div>
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            label="현재 비밀번호"
            placeholder="현재 비밀번호를 입력하세요"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <hr className="border-gray-100" />

        {/* 새 비밀번호 */}
        <div>
          <PasswordInput
            id="newPassword"
            name="newPassword"
            label="새 비밀번호"
            placeholder="새 비밀번호를 입력하세요 (8자 이상)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        {/* 새 비밀번호 확인 */}
        <div>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="새 비밀번호 확인"
            placeholder="새 비밀번호를 다시 입력하세요"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-main-bg text-white text-sm font-medium hover:bg-sub-bg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChangePasswordPage

