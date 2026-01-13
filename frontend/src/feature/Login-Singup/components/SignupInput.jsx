import { forwardRef } from 'react'

// 기본 텍스트 입력창
export const TextInput = forwardRef(function TextInput({ 
  id, 
  name, 
  type = 'text', 
  placeholder, 
  required, 
  maxLength, 
  onChange, 
  disabled,
  className = ''
}, ref) {
  return (
    <input
      ref={ref}
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      onChange={onChange}
      disabled={disabled}
      className={`flex-1 px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-sub-bg disabled:bg-gray-100 ${className}`}
    />
  )
})

// 인증 코드 입력창 (숫자만 6자리)
export function VerificationCodeInput({ value, onChange, disabled }) {
  const handleChange = (e) => {
    // 숫자만 허용, 최대 6자리
    const newValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
    onChange(newValue)
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder="인증번호 6자리"
      maxLength={6}
      disabled={disabled}
      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-sub-bg disabled:bg-gray-100"
    />
  )
}

// 프로필 사진 미리보기
export function PhotoPreview({ photoPreview }) {
  return (
    <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
      {photoPreview ? (
        <img src={photoPreview} alt="프로필 미리보기" className="w-full h-full object-cover" />
      ) : (
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )}
    </div>
  )
}

// 숨겨진 파일 입력창
export const HiddenFileInput = forwardRef(function HiddenFileInput({ 
  id, 
  onChange, 
  accept = 'image/*' 
}, ref) {
  return (
    <input
      type="file"
      ref={ref}
      onChange={onChange}
      accept={accept}
      className="hidden"
      id={id}
    />
  )
})

// 입력 필드 라벨
export function InputLabel({ htmlFor, children, optional = false }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm text-gray-700 mb-2">
      {children}
      {optional && <span className="text-gray-400 font-normal"> (선택)</span>}
    </label>
  )
}

// 검증 메시지
export function ValidationMessage({ message, isValid }) {
  if (!message) return null
  
  return (
    <p className={`mt-1 text-xs ${isValid ? 'text-green-600' : 'text-red-500'}`}>
      {message}
    </p>
  )
}

// 정보 메시지 (파란색/초록색)
export function InfoMessage({ message, isSuccess }) {
  if (!message) return null
  
  return (
    <p className={`mt-2 text-xs ${isSuccess ? 'text-green-600' : 'text-blue-600'}`}>
      {message}
    </p>
  )
}

