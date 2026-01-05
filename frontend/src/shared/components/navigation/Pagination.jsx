/**
 * 공통 페이징 컴포넌트
 * 
 * @param {number} currentPage - 현재 페이지 (1부터 시작)
 * @param {number} totalPages - 전체 페이지 수
 * @param {function} onPageChange - 페이지 변경 핸들러
 * @param {number} maxVisiblePages - 표시할 최대 페이지 버튼 수 (기본: 5)
 */
function Pagination({ currentPage, totalPages, onPageChange, maxVisiblePages = 5 }) {
  if (totalPages <= 1) return null

  // 표시할 페이지 번호 계산
  const getPageNumbers = () => {
    const pages = []
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    // 시작 페이지 조정
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      {/* 처음 */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm border border-gray-200 
                 disabled:text-gray-300 disabled:cursor-not-allowed
                 hover:border-main-bg hover:text-main-bg transition-colors"
      >
        <span className="text-[10px]">◀◀</span>
      </button>

      {/* 이전 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm border border-gray-200 
                 disabled:text-gray-300 disabled:cursor-not-allowed
                 hover:border-main-bg hover:text-main-bg transition-colors"
      >
        <span className="text-[10px]">◀</span>
      </button>

      {/* 페이지 번호 */}
      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 text-sm border transition-colors
                    ${currentPage === page
                      ? 'bg-main-bg text-white border-main-bg'
                      : 'border-gray-200 hover:border-main-bg hover:text-main-bg'
                    }`}
        >
          {page}
        </button>
      ))}

      {/* 다음 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm border border-gray-200 
                 disabled:text-gray-300 disabled:cursor-not-allowed
                 hover:border-main-bg hover:text-main-bg transition-colors"
      >
        <span className="text-[10px]">▶</span>
      </button>

      {/* 마지막 */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm border border-gray-200 
                 disabled:text-gray-300 disabled:cursor-not-allowed
                 hover:border-main-bg hover:text-main-bg transition-colors"
      >
        <span className="text-[10px]">▶▶</span>
      </button>
    </div>
  )
}

export default Pagination

