import { useEffect } from 'react'

/**
 * 공통 Alert 모달 컴포넌트 (alert() 대체)
 * 
 * @param {boolean} isOpen - 모달 표시 여부
 * @param {string} title - 모달 제목
 * @param {string} message - 메시지 내용
 * @param {string} type - 'success' | 'error' | 'warning' | 'info' (기본: 'info')
 * @param {string} confirmText - 확인 버튼 텍스트 (기본: '확인')
 * @param {function} onClose - 닫기 핸들러
 */
function AlertModal({ 
  isOpen, 
  title = '알림', 
  message, 
  type = 'info',
  confirmText = '확인',
  onClose 
}) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // 모달 열릴 때 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  // 타입별 스타일
  const typeStyles = {
    success: {
      icon: (
        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      iconBg: 'bg-green-100',
      button: 'bg-green-600 hover:bg-green-700',
    },
    error: {
      icon: (
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      iconBg: 'bg-red-100',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: (
        <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-amber-100',
      button: 'bg-amber-600 hover:bg-amber-700',
    },
    info: {
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-blue-100',
      button: 'bg-main-bg hover:bg-sub-bg',
    },
  }

  const style = typeStyles[type] || typeStyles.info

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div 
        className="bg-white shadow-xl w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* 아이콘 */}
          <div className="flex justify-center mb-4">
            <div className={`w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center`}>
              {style.icon}
            </div>
          </div>

          {/* 제목 */}
          <h3 className="text-lg font-bold text-center text-gray-800 mb-2">
            {title}
          </h3>

          {/* 메시지 */}
          <p className="text-sm text-gray-600 text-center whitespace-pre-line cursor-pointer">
            {message}
          </p>

          {/* 버튼 */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className={`w-full py-2.5 text-white font-medium transition-colors ${style.button} cursor-pointer`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertModal

