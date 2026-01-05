import { Spinner } from '../icons'

function Button({ 
  children, 
  type = 'button', 
  isLoading = false, 
  loadingText = '처리 중...',
  disabled = false,
  className = '',
  onClick
}) {
  return (
    <button
      type={type}
      disabled={isLoading || disabled}
      onClick={onClick}
      className={`w-full py-3 bg-main-bg cursor-pointer hover:opacity-90 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  )
}

export default Button

