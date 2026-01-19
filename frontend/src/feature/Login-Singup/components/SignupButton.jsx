// 메인 색상 버튼 (이메일 중복확인, 인증 코드 발송, 인증번호 확인)
export function PrimaryButton({ onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-3 bg-main-bg text-white hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {children}
    </button>
  )
}

// 회색 버튼 (닉네임 중복확인)
export function SecondaryButton({ onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-3 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {children}
    </button>
  )
}

// 인증 코드 발송 버튼
export function SendCodeButton({ onClick, disabled, isSending, isVerified }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-2.5 bg-sub-bg text-white text-sm hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {isSending ? '발송 중...' : isVerified ? '✓ 인증완료' : '인증코드 발송'}
    </button>
  )
}

// 삭제 버튼 (프로필 사진 삭제)
export function DeleteButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600 transition-colors cursor-pointer"
    >
      {children}
    </button>
  )
}

// 사진 선택 라벨 버튼
export function PhotoSelectLabel({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors text-center"
    >
      {children}
    </label>
  )
}

