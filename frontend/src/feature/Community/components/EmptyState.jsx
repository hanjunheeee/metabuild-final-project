/**
 * 빈 상태 표시 컴포넌트
 * 
 * @param {string} title - 제목
 * @param {string} description - 설명
 * @param {string} variant - 스타일 변형 ('default' | 'minimal')
 */
function EmptyState({ title, description, variant = 'default' }) {
  if (variant === 'minimal') {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        {title}
      </div>
    )
  }

  return (
    <div className="text-center py-16 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-700 mb-2">
        {title}
      </h3>
      <p className="text-gray-400 text-sm">
        {description}
      </p>
    </div>
  )
}

export default EmptyState

