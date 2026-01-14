import { useState } from 'react'

/**
 * 도서 검색/필터 컴포넌트
 * @param {function} onSearch - 검색 핸들러 ({ query, ages }) => void
 * @param {string} initialQuery - 초기 검색어
 */
function BookSearchFilter({ onSearch, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery)
  const [ages, setAges] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch({ query, ages })
  }

  const handleReset = () => {
    setQuery('')
    setAges('')
    onSearch({ query: '', ages: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex flex-wrap gap-2 items-center">
        {/* 검색어 입력 */}
        <input
          type="text"
          placeholder="도서명, 저자, ISBN 검색...(최대 30자)"
          maxLength={30}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full md:w-[32rem] px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-main-bg"
        />

        {/* 연령 필터 */}
        <select
          value={ages}
          onChange={(e) => {
            const newAges = e.target.value
            setAges(newAges)
            onSearch({ query, ages: newAges })
          }}
          className="px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-main-bg cursor-pointer"
        >
          <option value="">전체 연령</option>
          <option value="아동">아동</option>
          <option value="청소년">청소년</option>
          <option value="성인">성인</option>
        </select>

        {/* 버튼 그룹 */}
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white text-sm hover:bg-gray-700 cursor-pointer"
        >
          검색
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 cursor-pointer"
        >
          초기화
        </button>
      </div>
    </form>
  )
}

export default BookSearchFilter

