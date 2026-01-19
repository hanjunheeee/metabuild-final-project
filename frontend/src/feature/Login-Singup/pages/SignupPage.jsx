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
  InputLabel,
  ValidationMessage,
  InfoMessage,
  TurnstileCaptcha,
  EmailIcon,
  LockIcon,
  UserIcon,
  KeyIcon
} from '../components'
import { useSignupForm } from '../hooks'

function SignupPage() {
  const navigate = useNavigate()
  
  const {
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
    validateForm,
    uploadPhoto,
    cleanup,
  } = useSignupForm()

  const handleSignup = async (e) => {
    e.preventDefault()
    setSubmitError('')

    const isValid = validateForm()
    if (!isValid) {
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData(e.target)
      const email = formData.get('email')
      const password = formData.get('password')
      const nickname = formData.get('nickname')

      // 프로필 사진 업로드
      const userPhoto = await uploadPhoto()

      await signup(email, password, nickname, userPhoto, captchaToken)
      
      // 성공 시 정리
      cleanup()
      
      alert('회원가입이 완료되었습니다. 로그인해주세요.')
      navigate('/login')
    } catch (err) {
      const msg = err?.message || '회원가입에 실패했습니다.'
      // 서버 메시지를 필드 에러로 최대한 매핑
      if (msg.includes('이메일')) {
        setFieldError('email', msg)
      } else if (msg.includes('닉네임')) {
        setFieldError('nickname', msg)
      } else if (msg.toLowerCase().includes('captcha') || msg.includes('CAPTCHA')) {
        setFieldError('captcha', msg)
      } else {
        setSubmitError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center py-2 px-4">
      {/* 회원가입 카드 */}
      <div className="w-full max-w-xl border border-main-bg p-5 shadow-sm">
        {/* 타이틀 */}
        <div className="text-center mb-3">
          <h1 className="text-2xl font-extrabold text-sub-bg mb-1">회원가입</h1>
          <p className="text-gray-400 text-sm">새 계정을 만들어주세요</p>
        </div>

        {/* 에러 메시지 */}
        {submitError && (
          <div ref={errorRef} className="mb-3 p-2 bg-red-50 border border-red-200 text-red-600 text-sm">
            {submitError}
          </div>
        )}

        {/* 회원가입 폼 */}
        <form onSubmit={handleSignup} className="space-y-2">
          {/* 이메일 */}
          <div>
            {/* 이메일 입력 + 중복확인 버튼 */}
            <div className="flex gap-2">
              <TextInput
                ref={emailCheck.inputRef}
                id="email"
                name="email"
                type="email"
                placeholder="이메일을 입력해 주세요."
                maxLength={100}
                required
                onChange={handleEmailChange}
                icon={EmailIcon}
              />
              <PrimaryButton onClick={emailCheck.check} disabled={emailCheck.isChecking}>
                {emailCheck.isChecking ? '확인 중...' : '중복 확인'}
              </PrimaryButton>
            </div>
            {/* 중복확인 메시지 */}
            <ValidationMessage message={emailCheck.message} isValid={emailCheck.isChecked} />

            {/* 인증 코드 발송 버튼 */}
            <SendCodeButton
              onClick={sendVerificationCode}
              disabled={isSendingCode || !emailCheck.isChecked}
              isSending={isSendingCode}
              isVerified={isEmailVerified}
            />
            {/* 이메일 유효성(회원가입) 메시지: 인증코드 발송 버튼 밑에 표시 */}
            <ValidationMessage message={fieldErrors.email} isValid={false} />

            {/* 인증 코드 입력창 */}
            {showVerificationInput && (
              <div className="mt-2">
                <div className="flex gap-2">
                  <VerificationCodeInput
                    value={verificationCode}
                    onChange={setVerificationCode}
                    disabled={isEmailVerified}
                  />
                  {/* 인증번호 확인 버튼 */}
                  {!isEmailVerified && (
                    <PrimaryButton
                      onClick={verifyCode}
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
            ref={passwordRef}
            id="password"
            name="password"
            placeholder="비밀번호 (영문, 숫자, 특수문자 포함 8자 이상)"
            maxLength={20}
            required
            onChange={() => {
              clearFieldError('password')
              setSubmitError('')
            }}
            icon={LockIcon}
          />
          <ValidationMessage message={fieldErrors.password} isValid={false} />

          {/* 비밀번호 확인 */}
          <PasswordInput
            ref={passwordConfirmRef}
            id="passwordConfirm"
            name="passwordConfirm"
            placeholder="비밀번호 확인"
            maxLength={20}
            required
            onChange={() => {
              clearFieldError('passwordConfirm')
              setSubmitError('')
            }}
            icon={KeyIcon}
          />
          <ValidationMessage message={fieldErrors.passwordConfirm} isValid={false} />

          {/* 닉네임 */}
          <div>
            <div className="flex gap-2">
              <TextInput
                ref={nicknameCheck.inputRef}
                id="nickname"
                name="nickname"
                type="text"
                placeholder="닉네임 (최대 6자)"
                maxLength={6}
                required
                onChange={(e) => {
                  nicknameCheck.reset(e)
                  clearFieldError('nickname')
                  setSubmitError('')
                }}
                icon={UserIcon}
              />
              <SecondaryButton onClick={nicknameCheck.check} disabled={nicknameCheck.isChecking}>
                {nicknameCheck.isChecking ? '확인 중...' : '닉네임 중복확인'}
              </SecondaryButton>
            </div>
            <ValidationMessage message={nicknameCheck.message} isValid={nicknameCheck.isChecked} />
            <ValidationMessage message={fieldErrors.nickname} isValid={false} />
          </div>

          {/* 프로필 사진 + CAPTCHA 같은 줄 */}
          <div className="flex gap-4 items-center pt-1">
            {/* 프로필 사진 */}
            <div className="flex items-center gap-3">
              <PhotoPreview photoPreview={photo.photoPreview} />
              <div className="flex flex-col gap-1">
                <div className="flex gap-2 items-center">
                  <HiddenFileInput
                    ref={photo.fileInputRef}
                    id="userPhoto"
                    onChange={photo.handlePhotoChange}
                    accept="image/jpeg,image/png"
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
                <p className="text-xs text-gray-400">JPG, PNG (최대 5MB)</p>
              </div>
              <ValidationMessage message={photo.photoError} isValid={false} />
            </div>

            {/* CAPTCHA */}
            {isCaptchaEnabled && (
              <div className="ml-auto">
                <TurnstileCaptcha
                  siteKey={turnstileSiteKey}
                  onVerify={(token) => {
                    setCaptchaToken(token)
                    clearFieldError('captcha')
                    setSubmitError('')
                  }}
                  onExpire={() => {
                    setCaptchaToken('')
                  }}
                  onError={() => {
                    setCaptchaToken('')
                  }}
                />
                <ValidationMessage message={fieldErrors.captcha} isValid={false} />
              </div>
            )}
          </div>

          {/* 회원가입 버튼 */}
          <Button type="submit" isLoading={isLoading} loadingText="가입 중...">
            회원가입
          </Button>
        </form>

        {/* 로그인 링크 */}
        <div className="mt-3 text-center">
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
