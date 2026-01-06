import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchBooks } from '../api/libraryApi'

function LibrarySearchPage() {
  const [query, setQuery] = useState('')
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSearch = async () => {
    if (!query.trim()) {
      alert('책 제목을 입력해 주세요.')
      return
    }

    setLoading(true)
    setError('')
    setBooks([])

    try {
      const data = await searchBooks(query)
      const bookList = data.response?.docs || []
      
      if (bookList.length === 0) {
        setError('검색 결과가 없습니다.')
      } else {
        setBooks(bookList)
      }
    } catch (e) {
      console.error(e)
      setError('서버 통신 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyUp = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const goToMap = (isbn, title) => {
    if (!isbn || isbn === 'undefined') {
      alert('ISBN 정보가 없는 도서입니다.')
      return
    }
    navigate(`/library/map?isbn=${isbn}&title=${encodeURIComponent(title)}`)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pt-12 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">📚 도서 실시간 검색</h2>
        
        {/* 검색 입력 */}
        <div className="mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyUp={handleKeyUp}
            placeholder="어떤 책을 찾으시나요?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full mt-3 py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 transition disabled:bg-gray-400"
          >
            {loading ? '검색 중...' : '책 검색하기'}
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-center text-red-500 mb-4">{error}</p>
        )}

        {/* 검색 결과 */}
        <div className="max-h-[500px] overflow-y-auto space-y-4">
          {books.map((item, index) => {
            const book = item.doc
            return (
              <div
                key={index}
                className="flex items-start p-4 border border-gray-200 rounded-xl bg-white hover:-translate-y-1 hover:shadow-md transition"
              >
                <img
                  src={book.bookImageURL || 'https://via.placeholder.com/70x100?text=No+Image'}
                  alt="표지"
                  className="w-16 h-24 rounded object-cover border border-gray-200 mr-4 flex-shrink-0"
                />
                <div className="flex-1 flex flex-col justify-between min-h-[96px]">
                  <div>
                    <div className="font-bold text-gray-800 text-sm leading-tight mb-1">
                      {book.bookname}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      {book.authors}
                    </div>
                    <div className="text-xs text-gray-400">
                      ISBN: {book.isbn13}
                    </div>
                  </div>
                  <button
                    onClick={() => goToMap(book.isbn13, book.bookname)}
                    className="self-start mt-2 px-3 py-2 bg-pink-300 text-white rounded-md text-xs font-bold hover:bg-pink-400 transition"
                  >
                    📍 대출 가능 도서관 찾기
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default LibrarySearchPage

