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
      const nicknameRegex = /^[a-zA-Z0-9가-힣]{2,5}$/
      if (!nicknameRegex.test(value)) {
        if (value.length < 2) return '닉네임은 2자 이상이어야 합니다.'
        if (value.length > 5) return '닉네임은 5자 이하여야 합니다.'
        return '닉네임은 영문, 숫자, 한글만 사용 가능합니다. (자음/모음 단독 불가)'
      }
      return null
    }
  )

  const photo = usePhotoUpload({ maxSizeMB: 5 })

  // === Refs ===
  const passwordRef = useRef(null)
  const passwordConfirmRef = useRef(null)
  const agreeCheckboxRef = useRef(null)
  const errorRef = useRef(null)

  // === 이메일 인증 상태 ===
  const [showVerificationInput, setShowVerificationInput] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [emailVerifyMessage, setEmailVerifyMessage] = useState('')

  // === 약관 동의 상태 ===
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)

  // === 폼 상태 ===
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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
      } else {
        // 첫 진입 시 약관 동의 상태 초기화
        localStorage.removeItem('termsAgreed')
        localStorage.removeItem('privacyAgreed')
        setTermsAgreed(false)
        setPrivacyAgreed(false)
      }
    }

    const timeoutId = setTimeout(restoreFormData, 0)

    // 약관 동의 상태 확인
    const checkAgreementStatus = () => {
      const termsAgreedStorage = localStorage.getItem('termsAgreed') === 'true'
      const privacyAgreedStorage = localStorage.getItem('privacyAgreed') === 'true'
      setTermsAgreed(termsAgreedStorage)
      setPrivacyAgreed(privacyAgreedStorage)

      if (termsAgreedStorage && privacyAgreedStorage && agreeCheckboxRef.current) {
        agreeCheckboxRef.current.checked = true
      }
    }

    if (savedData) {
      checkAgreementStatus()
    }

    window.addEventListener('storage', checkAgreementStatus)
    window.addEventListener('focus', checkAgreementStatus)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('storage', checkAgreementStatus)
      window.removeEventListener('focus', checkAgreementStatus)
    }
  }, [])

  // === 이메일 변경 핸들러 ===
  const handleEmailChange = useCallback(() => {
    emailCheck.reset()
    setIsEmailVerified(false)
    setShowVerificationInput(false)
    setVerificationCode('')
    setEmailVerifyMessage('')
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
      } else {
        setEmailVerifyMessage(data.message || '인증번호가 올바르지 않습니다.')
      }
    } catch {
      setEmailVerifyMessage('인증번호가 올바르지 않습니다.')
    } finally {
      setIsVerifying(false)
    }
  }, [verificationCode])

  // === 폼 유효성 검사 ===
  const validateForm = useCallback(() => {
    if (!emailCheck.isChecked) {
      return '이메일 중복확인을 해주세요.'
    }
    if (!isEmailVerified) {
      return '이메일 인증을 완료해주세요.'
    }

    const password = passwordRef.current?.value || ''
    const passwordConfirm = passwordConfirmRef.current?.value || ''

    if (password !== passwordConfirm) {
      return '비밀번호가 일치하지 않습니다.'
    }
    if (password.length < 8) {
      return '비밀번호는 8자 이상이어야 합니다.'
    }
    if (!nicknameCheck.isChecked) {
      return '닉네임 중복확인을 해주세요.'
    }

    const isAgreed = agreeCheckboxRef.current?.checked
    if (!isAgreed) {
      return '이용약관 및 개인정보처리방침에 동의해주세요.'
    }

    const termsAgreedStorage = localStorage.getItem('termsAgreed') === 'true'
    const privacyAgreedStorage = localStorage.getItem('privacyAgreed') === 'true'
    if (!termsAgreedStorage || !privacyAgreedStorage) {
      return '이용약관 및 개인정보처리방침을 확인하고 동의해주세요.'
    }

    return null
  }, [emailCheck.isChecked, isEmailVerified, nicknameCheck.isChecked])

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
    localStorage.removeItem('termsAgreed')
    localStorage.removeItem('privacyAgreed')
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
    agreeCheckboxRef,
    errorRef,

    // 이메일 인증
    showVerificationInput,
    verificationCode,
    setVerificationCode,
    isEmailVerified,
    isSendingCode,
    isVerifying,
    emailVerifyMessage,

    // 약관 동의
    termsAgreed,
    setTermsAgreed,
    privacyAgreed,
    setPrivacyAgreed,

    // 폼 상태
    isLoading,
    setIsLoading,
    error,
    setError,

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

