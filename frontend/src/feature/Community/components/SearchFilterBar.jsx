// 게시글 종류 옵션
const KIND_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'FREE', label: '자유' },
  { value: 'QUESTION', label: '질문' },
  { value: 'REVIEW', label: '리뷰' },
]

/**
 * 검색 및 필터 바 컴포넌트
 * 
 * @param {string} searchTerm - 검색어
 * @param {Function} onSearchChange - 검색어 변경 핸들러
 * @param {string} sortBy - 현재 정렬 기준 ('latest' | 'popular')
 * @param {Function} onSortChange - 정렬 변경 핸들러
 * @param {string} kindFilter - 게시글 종류 필터 ('ALL' | 'FREE' | 'QUESTION' | 'REVIEW')
 * @param {Function} onKindChange - 게시글 종류 변경 핸들러
 */
function SearchFilterBar({ 
  searchTerm, 
  onSearchChange, 
  sortBy, 
  onSortChange,
  kindFilter = 'ALL',
  onKindChange
}) {
  return (
    <div className="border border-gray-200 p-4 shadow-sm mb-6">
      {/* 게시글 종류 필터 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {KIND_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onKindChange(option.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors border
                      ${kindFilter === option.value
                        ? 'bg-sub-bg text-white border-sub-bg'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-sub-bg hover:text-sub-bg cursor-pointer'
                      }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* 검색 입력 */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="제목, 내용, 책 이름으로 검색..."
            value={searchTerm}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 
                     focus:outline-none focus:ring-2 focus:ring-main-bg focus:border-transparent
                     text-gray-700 placeholder-gray-400 text-sm"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* 정렬 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={() => onSortChange('latest')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors
                      ${sortBy === 'latest'
                        ? 'bg-main-bg text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
                      }`}
          >
            최신순
          </button>
          <button
            onClick={() => onSortChange('popular')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors
                      ${sortBy === 'popular'
                        ? 'bg-main-bg text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
                      }`}
          >
            인기순
          </button>
        </div>
      </div>
    </div>
  )
}

export default SearchFilterBar

