import { useState, useRef, useEffect, useCallback } from 'react'
import { useDuplicateCheck } from './useDuplicateCheck'
import { usePhotoUpload } from './usePhotoUpload'

const API_BASE_URL = 'http://localhost:7878'
const SIGNUP_FORM_KEY = 'signupFormData'

// sessionStorage 유틸
const saveToStorage = (data) => sessionStorage.setItem(SIGNUP_FORM_KEY, JSON.stringify(data))
const loadFromStorage = () => {
  const saved = sessionStorage.getItem(SIGNUP_FORM_KEY)
  return saved ? JSON.parse(saved) : null
}
const clearStorage = () => sessionStorage.removeItem(SIGNUP_FORM_KEY)

/**
 * 회원가입 폼 상태 관리 훅
 * 기존 훅들을 조합하고, 추가 상태와 저장/복원 로직을 관리
 */
export function useSignupForm() {
  // === 기존 훅 조합 ===
  const emailCheck = useDuplicateCheck(
    `${API_BASE_URL}/api/users/check-email`,
    'email',
    (value) => {
      if (!value) return '이메일을 입력해주세요.'
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) return '올바른 이메일 형식이 아닙니다.'
      return null
    }
  )

  const nicknameCheck = useDuplicateCheck(
    `${API_BASE_URL}/api/users/check-nickname`,
    'nickname',
    (value) => {
      if (!value) return '닉네임을 입력해주세요.'
      const nicknameRegex = /^[a-zA-Z0-9가-힣]{2,6}$/
      if (!nicknameRegex.test(value)) {
        if (value.length < 2) return '닉네임은 2자 이상이어야 합니다.'
        if (value.length > 6) return '닉네임은 6자 이하여야 합니다.'
        return '닉네임은 영문, 숫자, 한글만 사용 가능합니다. (자음/모음 단독 불가)'
      }
      return null
    }
  )

  const photo = usePhotoUpload({ maxSizeMB: 5 })

  // === Refs ===
  const passwordRef = useRef(null)
  const passwordConfirmRef = useRef(null)
  const errorRef = useRef(null)

  // === 이메일 인증 상태 ===
  const [showVerificationInput, setShowVerificationInput] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [emailVerifyMessage, setEmailVerifyMessage] = useState('')

  // === 폼 상태 ===
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // === 필드별 에러(회원가입 유효성) ===
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    nickname: '',
    captcha: '',
  })

  const setFieldError = useCallback((field, message) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }))
  }, [])

  const clearFieldError = useCallback((field) => {
    setFieldErrors((prev) => ({ ...prev, [field]: '' }))
  }, [])

  // === CAPTCHA(Turnstile) ===
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITEKEY || ''
  const isCaptchaEnabled = Boolean(turnstileSiteKey)
  const [captchaToken, setCaptchaToken] = useState('')

  // === 폼 데이터 저장 ===
  const saveFormData = useCallback(() => {
    const formData = {
      email: emailCheck.inputRef.current?.value || '',
      nickname: nicknameCheck.inputRef.current?.value || '',
      password: passwordRef.current?.value || '',
      passwordConfirm: passwordConfirmRef.current?.value || '',
      emailChecked: emailCheck.isChecked,
      emailVerified: isEmailVerified,
      nicknameChecked: nicknameCheck.isChecked,
      photoPreview: photo.photoPreview || null,
    }
    saveToStorage(formData)
  }, [emailCheck.isChecked, isEmailVerified, nicknameCheck.isChecked, photo.photoPreview])

  // === 폼 데이터 복원 ===
  useEffect(() => {
    const savedData = loadFromStorage()

    const restoreFormData = () => {
      if (savedData) {
        // 이메일 복원
        if (savedData.email && emailCheck.inputRef.current) {
          emailCheck.inputRef.current.value = savedData.email
        }
        // 닉네임 복원
        if (savedData.nickname && nicknameCheck.inputRef.current) {
          nicknameCheck.inputRef.current.value = savedData.nickname
        }
        // 비밀번호 복원
        if (savedData.password && passwordRef.current) {
          passwordRef.current.value = savedData.password
        }
        // 비밀번호 확인 복원
        if (savedData.passwordConfirm && passwordConfirmRef.current) {
          passwordConfirmRef.current.value = savedData.passwordConfirm
        }
        // 이메일 중복확인 상태 복원
        if (savedData.emailChecked) {
          emailCheck.setIsChecked(true)
          emailCheck.setMessage('사용 가능한 이메일입니다.')
        }
        // 이메일 인증 상태 복원
        if (savedData.emailVerified) {
          setIsEmailVerified(true)
          setShowVerificationInput(true)
          setEmailVerifyMessage('이메일 인증이 완료되었습니다.')
        }
        // 닉네임 중복확인 상태 복원
        if (savedData.nicknameChecked) {
          nicknameCheck.setIsChecked(true)
          nicknameCheck.setMessage('사용 가능한 닉네임입니다.')
        }
        // 프로필 사진 미리보기 복원
        if (savedData.photoPreview) {
          photo.setPhotoPreview(savedData.photoPreview)
        }
        // 복원 후 sessionStorage 삭제
        clearStorage()
      }
    }

    const timeoutId = setTimeout(restoreFormData, 0)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  // === 이메일 변경 핸들러 ===
  const handleEmailChange = useCallback(() => {
    emailCheck.reset()
    setIsEmailVerified(false)
    setShowVerificationInput(false)
    setVerificationCode('')
    setEmailVerifyMessage('')
    clearFieldError('email')
    setSubmitError('')
  }, [emailCheck])

  // === 이메일 인증번호 발송 ===
  const sendVerificationCode = useCallback(async () => {
    const email = emailCheck.inputRef.current?.value
    if (!email) {
      setEmailVerifyMessage('이메일을 입력해주세요.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailVerifyMessage('올바른 이메일 형식이 아닙니다.')
      return
    }

    setIsSendingCode(true)
    setEmailVerifyMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/email/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await response.json()

      if (data.success) {
        setShowVerificationInput(true)
        setEmailVerifyMessage('인증번호가 발송되었습니다. 이메일을 확인해주세요.')
      } else {
        setEmailVerifyMessage(data.message || '인증번호 발송에 실패했습니다.')
      }
    } catch {
      setEmailVerifyMessage('인증번호 발송에 실패했습니다.')
    } finally {
      setIsSendingCode(false)
    }
  }, [])

  // === 인증번호 확인 ===
  const verifyCode = useCallback(async () => {
    if (verificationCode.length !== 6) {
      setEmailVerifyMessage('6자리 인증번호를 입력해주세요.')
      return
    }

    const email = emailCheck.inputRef.current?.value
    setIsVerifying(true)
    setEmailVerifyMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/email/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      })
      const data = await response.json()

      if (data.success) {
        setIsEmailVerified(true)
        setEmailVerifyMessage('이메일 인증이 완료되었습니다.')
        clearFieldError('email')
      } else {
        setEmailVerifyMessage(data.message || '인증번호가 올바르지 않습니다.')
      }
    } catch {
      setEmailVerifyMessage('인증번호가 올바르지 않습니다.')
    } finally {
      setIsVerifying(false)
    }
  }, [verificationCode])

  // === 폼 유효성 검사 (필드별 에러 세팅) ===
  const validateForm = useCallback(() => {
    let hasError = false

    // 이전 에러 초기화
    setFieldErrors({
      email: '',
      password: '',
      passwordConfirm: '',
      nickname: '',
      captcha: '',
    })
    setSubmitError('')

    const email = emailCheck.inputRef.current?.value || ''
    const nickname = nicknameCheck.inputRef.current?.value || ''

    // 이메일: 중복확인 + 인증 필수
    if (!email) {
      hasError = true
      setFieldError('email', '이메일을 입력해주세요.')
    } else if (!emailCheck.isChecked) {
      hasError = true
      setFieldError('email', '이메일 중복확인을 해주세요.')
    } else if (!isEmailVerified) {
      hasError = true
      setFieldError('email', '이메일 인증을 완료해주세요.')
    }

    // 비밀번호
    const password = passwordRef.current?.value || ''
    const passwordConfirm = passwordConfirmRef.current?.value || ''

    if (!password) {
      hasError = true
      setFieldError('password', '비밀번호를 입력해주세요.')
    } else {
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
      if (!passwordRegex.test(password)) {
        hasError = true
        setFieldError('password', '비밀번호는 8자 이상, 영문, 숫자, 특수문자(@$!%*#?&)를 포함해야 합니다.')
      }
    }

    if (!passwordConfirm) {
      hasError = true
      setFieldError('passwordConfirm', '비밀번호 확인을 입력해주세요.')
    } else if (password && password !== passwordConfirm) {
      hasError = true
      setFieldError('passwordConfirm', '비밀번호가 일치하지 않습니다.')
    }

    // 닉네임
    const nicknameRegex = /^[a-zA-Z0-9가-힣]{2,6}$/
    if (!nickname) {
      hasError = true
      setFieldError('nickname', '닉네임을 입력해주세요.')
    } else if (!nicknameRegex.test(nickname)) {
      hasError = true
      if (nickname.length < 2) setFieldError('nickname', '닉네임은 2자 이상이어야 합니다.')
      else if (nickname.length > 6) setFieldError('nickname', '닉네임은 6자 이하여야 합니다.')
      else setFieldError('nickname', '닉네임은 영문, 숫자, 한글만 사용 가능합니다. (자음/모음 단독 불가)')
    } else if (!nicknameCheck.isChecked) {
      hasError = true
      setFieldError('nickname', '닉네임 중복확인을 해주세요.')
    }

    // CAPTCHA
    if (isCaptchaEnabled && !captchaToken) {
      hasError = true
      setFieldError('captcha', 'CAPTCHA 인증을 완료해주세요.')
    }

    return !hasError
  }, [
    emailCheck.isChecked,
    isEmailVerified,
    nicknameCheck.isChecked,
    isCaptchaEnabled,
    captchaToken,
    setFieldError,
  ])

  // === 프로필 사진 업로드 ===
  const uploadPhoto = useCallback(async () => {
    if (!photo.photoFile && !photo.photoPreview) {
      return null
    }

    const formData = new FormData()

    if (photo.photoFile) {
      formData.append('file', photo.photoFile)
    } else if (photo.photoPreview) {
      const response = await fetch(photo.photoPreview)
      const blob = await response.blob()
      formData.append('file', blob, 'profile.jpg')
    }

    const uploadResponse = await fetch(`${API_BASE_URL}/api/files/upload/profile`, {
      method: 'POST',
      body: formData
    })
    const uploadData = await uploadResponse.json()

    if (uploadData.success) {
      return uploadData.filename
    } else {
      throw new Error(uploadData.message || '프로필 사진 업로드에 실패했습니다.')
    }
  }, [photo.photoFile, photo.photoPreview])

  // === 회원가입 후 정리 ===
  const cleanup = useCallback(() => {
    clearStorage()
  }, [])

  // === 에러 스크롤 ===
  const scrollToError = useCallback(() => {
    errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  return {
    // 기존 훅들
    emailCheck,
    nicknameCheck,
    photo,

    // Refs
    passwordRef,
    passwordConfirmRef,
    errorRef,

    // 이메일 인증
    showVerificationInput,
    verificationCode,
    setVerificationCode,
    isEmailVerified,
    isSendingCode,
    isVerifying,
    emailVerifyMessage,

    // 폼 상태
    isLoading,
    setIsLoading,
    submitError,
    setSubmitError,
    fieldErrors,
    setFieldError,
    clearFieldError,

    // CAPTCHA
    turnstileSiteKey,
    isCaptchaEnabled,
    captchaToken,
    setCaptchaToken,

    // 핸들러
    handleEmailChange,
    sendVerificationCode,
    verifyCode,
    saveFormData,
    validateForm,
    uploadPhoto,
    cleanup,
    scrollToError,
  }
}

