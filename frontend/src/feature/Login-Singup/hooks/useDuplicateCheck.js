import { useState, useRef } from 'react'

/**
 * 중복 확인 훅 (이메일, 닉네임 등)
 * @param {string} apiUrl - 중복 확인 API URL (예: '/api/users/check-email')
 * @param {string} paramName - 쿼리 파라미터 이름 (예: 'email', 'nickname')
 * @param {Function} validate - 값 검증 함수 (에러 메시지 반환, 성공 시 null)
 */
export function useDuplicateCheck(apiUrl, paramName, validate) {
  const [isChecked, setIsChecked] = useState(false)
  const [message, setMessage] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const inputRef = useRef(null)

  // 입력 변경 시 상태 초기화
  const reset = () => {
    setIsChecked(false)
    setMessage('')
  }

  // 중복 확인 실행
  const check = async () => {
    const value = inputRef.current?.value

    // 값 검증
    const validationError = validate ? validate(value) : null
    if (validationError) {
      setMessage(validationError)
      setIsChecked(false)
      return false
    }

    setIsChecking(true)
    try {
      const response = await fetch(`${apiUrl}?${paramName}=${encodeURIComponent(value)}`)
      const data = await response.json()
      
      if (data.available) {
        setMessage('사용 가능합니다.')
        setIsChecked(true)
        return true
      } else {
        setMessage('이미 사용 중입니다.')
        setIsChecked(false)
        return false
      }
    } catch (err) {
      setMessage('중복 확인 중 오류가 발생했습니다.')
      setIsChecked(false)
      return false
    } finally {
      setIsChecking(false)
    }
  }

  return {
    inputRef,
    isChecked,
    message,
    isChecking,
    check,
    reset,
    setMessage,
    setIsChecked
  }
}

