import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PasswordInput, Button } from '@/shared/components'
import { signup } from '@/shared/api/authApi'
import { 
  PrimaryButton, 
  SecondaryButton, 
  SendCodeButton, 
  DeleteButton, 
  PhotoSelectLabel,
  TextInput,
  VerificationCodeInput,
  PhotoPreview,
  HiddenFileInput,
  AgreeCheckbox,
  InputLabel,
  ValidationMessage,
  InfoMessage
} from '../components'
import { useDuplicateCheck, usePhotoUpload } from '../hooks'

function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  // 이메일 인증 관련 state
  const [showVerificationInput, setShowVerificationInput] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [emailVerifyMessage, setEmailVerifyMessage] = useState('')
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const errorRef = useRef(null)
  const navigate = useNavigate()
  const agreeCheckboxRef = useRef(null)

  // 이메일 중복확인 훅
  const emailCheck = useDuplicateCheck(
    'http://localhost:7878/api/users/check-email',
    'email',
    (value) => {
      if (!value) return '이메일을 입력해주세요.'
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) return '올바른 이메일 형식이 아닙니다.'
      return null
    }
  )

  // 닉네임 중복확인 훅
  const nicknameCheck = useDuplicateCheck(
    'http://localhost:7878/api/users/check-nickname',
    'nickname',
    (value) => {
      if (!value) return '닉네임을 입력해주세요.'
      // 2~5글자, 영문/숫자/완성형 한글만 허용 (자음/모음 단독 불가)
      const nicknameRegex = /^[a-zA-Z0-9가-힣]{2,5}$/
      if (!nicknameRegex.test(value)) {
        if (value.length < 2) return '닉네임은 2자 이상이어야 합니다.'
        if (value.length > 5) return '닉네임은 5자 이하여야 합니다.'
        return '닉네임은 영문, 숫자, 한글만 사용 가능합니다. (자음/모음 단독 불가)'
      }
      return null
    }
  )

  // 사진 업로드 훅
  const photo = usePhotoUpload({ maxSizeMB: 5, onError: setError })

  // 에러 메시지로 스크롤
  const scrollToError = () => {
    errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // localStorage에서 동의 상태 확인
  useEffect(() => {
    const checkAgreementStatus = () => {
      const termsAgreedStorage = localStorage.getItem('termsAgreed') === 'true'
      const privacyAgreedStorage = localStorage.getItem('privacyAgreed') === 'true'
      setTermsAgreed(termsAgreedStorage)
      setPrivacyAgreed(privacyAgreedStorage)
      
      // 둘 다 동의했으면 체크박스 체크
      if (termsAgreedStorage && privacyAgreedStorage && agreeCheckboxRef.current) {
        agreeCheckboxRef.current.checked = true
      }
    }

    checkAgreementStatus()
    
    // storage 이벤트 리스너 추가 (다른 탭에서 변경된 경우 감지)
    const handleStorageChange = () => {
      checkAgreementStatus()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // 페이지 포커스 시에도 확인
    const handleFocus = () => {
      checkAgreementStatus()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // 이메일 변경 시 상태 초기화
  const handleEmailChange = () => {
    // 중복확인 상태 초기화
    emailCheck.reset()
    // 인증 상태 초기화
    setIsEmailVerified(false)
    setShowVerificationInput(false)
    setVerificationCode('')
    setEmailVerifyMessage('')
  }

  // 이메일 인증번호 발송 핸들러
  const handleSendVerificationCode = async () => {
    const email = emailCheck.inputRef.current?.value
    if (!email) {
      setEmailVerifyMessage('이메일을 입력해주세요.')
      return
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailVerifyMessage('올바른 이메일 형식이 아닙니다.')
      return
    }

    setIsSendingCode(true)
    setEmailVerifyMessage('')

    try {
      const response = await fetch('http://localhost:7878/api/email/send-code', {
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
    } catch (err) {
      setEmailVerifyMessage('인증번호 발송에 실패했습니다.')
    } finally {
      setIsSendingCode(false)
    }
  }

  // 인증번호 확인 핸들러
  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setEmailVerifyMessage('6자리 인증번호를 입력해주세요.')
      return
    }

    const email = emailCheck.inputRef.current?.value
    setIsVerifying(true)
    setEmailVerifyMessage('')

    try {
      const response = await fetch('http://localhost:7878/api/email/verify-code', {
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
    } catch (err) {
      setEmailVerifyMessage('인증번호가 올바르지 않습니다.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')
    const passwordConfirm = formData.get('passwordConfirm')
    const nickname = formData.get('nickname')

    // 이메일 중복확인 여부 검증
    if (!emailCheck.isChecked) {
        setError('이메일 중복확인을 해주세요.')
        setTimeout(scrollToError, 100)
        return
    }
  
    // 이메일 인증 여부 검증
    if (!isEmailVerified) {
        setError('이메일 인증을 완료해주세요.')
        setTimeout(scrollToError, 100)
        return
    }

    // 비밀번호 확인
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      setTimeout(scrollToError, 100)
      return
    }

    // 비밀번호 길이 검증
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      setTimeout(scrollToError, 100)
      return
    }

    // 닉네임 중복확인 여부 검증
    if (!nicknameCheck.isChecked) {
      setError('닉네임 중복확인을 해주세요.')
      setTimeout(scrollToError, 100)
      return
    }

    // 이용약관 및 개인정보처리방침 동의 여부 검증
    const isAgreed = agreeCheckboxRef.current?.checked
    if (!isAgreed) {
      setError('이용약관 및 개인정보처리방침에 동의해주세요.')
      setTimeout(scrollToError, 100)
      return
    }

    // localStorage에서 동의 상태 확인
    const termsAgreedStorage = localStorage.getItem('termsAgreed') === 'true'
    const privacyAgreedStorage = localStorage.getItem('privacyAgreed') === 'true'
    if (!termsAgreedStorage || !privacyAgreedStorage) {
      setError('이용약관 및 개인정보처리방침을 확인하고 동의해주세요.')
      setTimeout(scrollToError, 100)
      return
    }

    setIsLoading(true)

    try {
      let userPhoto = null

      // 프로필 사진이 있으면 먼저 업로드
      if (photo.photoFile) {
        const formData = new FormData()
        formData.append('file', photo.photoFile)

        const uploadResponse = await fetch('http://localhost:7878/api/files/upload/profile', {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadResponse.json()

        if (uploadData.success) {
          userPhoto = uploadData.filename
        } else {
          throw new Error(uploadData.message || '프로필 사진 업로드에 실패했습니다.')
        }
      }

      await signup(email, password, nickname, userPhoto)
      // 회원가입 성공 시 localStorage 정리
      localStorage.removeItem('termsAgreed')
      localStorage.removeItem('privacyAgreed')
      // 회원가입 성공 시 로그인 페이지로 이동
      alert('회원가입이 완료되었습니다. 로그인해주세요.')
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center py-8 px-4">
      {/* 회원가입 카드 */}
      <div className="w-full max-w-xl border border-main-bg p-8 shadow-sm">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-sub-bg mb-2">회원가입</h1>
          <p className="text-gray-400 text-sm">새 계정을 만들어주세요</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div ref={errorRef} className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* 회원가입 폼 */}
        <form onSubmit={handleSignup} className="space-y-5">
          {/* 이메일 */}
          <div>
            <InputLabel htmlFor="email">이메일</InputLabel>
            {/* 이메일 입력 + 중복확인 버튼 */}
            <div className="flex gap-2">
              <TextInput
                ref={emailCheck.inputRef}
                id="email"
                name="email"
                type="email"
                placeholder="이메일을 입력해 주세요."
                required
                onChange={handleEmailChange}
              />
              <PrimaryButton onClick={emailCheck.check} disabled={emailCheck.isChecking}>
                {emailCheck.isChecking ? '확인 중...' : '중복 확인'}
              </PrimaryButton>
            </div>
            {/* 중복확인 메시지 */}
            <ValidationMessage message={emailCheck.message} isValid={emailCheck.isChecked} />

            {/* 인증 코드 발송 버튼 */}
            <SendCodeButton
              onClick={handleSendVerificationCode}
              disabled={isSendingCode || !emailCheck.isChecked}
              isSending={isSendingCode}
              isVerified={isEmailVerified}
            />

            {/* 인증 코드 입력창 */}
            {showVerificationInput && (
              <div className="mt-3">
                <InputLabel>인증 코드</InputLabel>
                <div className="flex gap-2">
                  <VerificationCodeInput
                    value={verificationCode}
                    onChange={setVerificationCode}
                    disabled={isEmailVerified}
                  />
                  {/* 인증번호 확인 버튼 */}
                  {!isEmailVerified && (
                    <PrimaryButton
                      onClick={handleVerifyCode}
                      disabled={isVerifying || verificationCode.length !== 6}
                    >
                      {isVerifying ? '확인 중...' : '인증번호 확인'}
                    </PrimaryButton>
                  )}
                </div>
              </div>
            )}

            {/* 인증 메시지 */}
            <InfoMessage message={emailVerifyMessage} isSuccess={isEmailVerified} />
          </div>

          {/* 비밀번호 */}
          <PasswordInput
            id="password"
            name="password"
            label="비밀번호"
            placeholder="8자 이상 입력해 주세요."
            required
          />

          {/* 비밀번호 확인 */}
          <PasswordInput
            id="passwordConfirm"
            name="passwordConfirm"
            label="비밀번호 확인"
            placeholder="비밀번호를 다시 입력해 주세요."
            required
          />

          {/* 닉네임 */}
          <div>
            <InputLabel htmlFor="nickname">닉네임</InputLabel>
            <div className="flex gap-2">
              <TextInput
                ref={nicknameCheck.inputRef}
                id="nickname"
                name="nickname"
                type="text"
                placeholder="닉네임을 입력해 주세요."
                maxLength={30}
                required
                onChange={nicknameCheck.reset}
              />
              <SecondaryButton onClick={nicknameCheck.check} disabled={nicknameCheck.isChecking}>
                {nicknameCheck.isChecking ? '확인 중...' : '닉네임 중복확인'}
              </SecondaryButton>
            </div>
            <ValidationMessage message={nicknameCheck.message} isValid={nicknameCheck.isChecked} />
          </div>

          {/* 프로필 사진 */}
          <div>
            <InputLabel optional>프로필 사진</InputLabel>
            <div className="flex items-center gap-4">
              {/* 미리보기 */}
              <PhotoPreview photoPreview={photo.photoPreview} />
              {/* 버튼들 */}
              <div className="flex flex-row gap-2 items-center">
                <HiddenFileInput
                  ref={photo.fileInputRef}
                  id="userPhoto"
                  onChange={photo.handlePhotoChange}
                  accept="image/*"
                />
                <PhotoSelectLabel htmlFor="userPhoto">
                  사진 선택
                </PhotoSelectLabel>
                {photo.photoPreview && (
                  <DeleteButton onClick={photo.handlePhotoRemove}>
                    삭제
                  </DeleteButton>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">JPG, PNG, GIF (최대 5MB)</p>
          </div>

          {/* 이용약관 동의 */}
          <div className="flex items-start gap-2">
            <input
              ref={agreeCheckboxRef}
              type="checkbox"
              id="agree"
              className="w-4 h-4 mt-0.5 border-gray-300 bg-gray-50 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
              required
              checked={termsAgreed && privacyAgreed}
              onChange={(e) => {
                if (!e.target.checked) {
                  setTermsAgreed(false)
                  setPrivacyAgreed(false)
                }
              }}
            />
            <label htmlFor="agree" className="text-sm text-gray-600">
              <Link 
                to="/terms" 
                state={{ from: 'signup' }}
                className="text-sub-bg hover:text-main-bg"
                onClick={(e) => e.stopPropagation()}
              >
                이용약관
              </Link>
              {' '}및{' '}
              <Link 
                to="/privacy" 
                state={{ from: 'signup' }}
                className="text-sub-bg hover:text-main-bg"
                onClick={(e) => e.stopPropagation()}
              >
                개인정보처리방침
              </Link>
              에 동의합니다.
            </label>
          </div>
          {(!termsAgreed || !privacyAgreed) && (
            <p className="text-xs text-red-500 mt-1">
              이용약관과 개인정보처리방침을 모두 확인하고 동의해주세요.
            </p>
          )}

          {/* 회원가입 버튼 */}
          <Button type="submit" isLoading={isLoading} loadingText="가입 중...">
            회원가입
          </Button>
        </form>

        {/* 로그인 링크 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-sub-bg hover:text-main-bg font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignupPage

