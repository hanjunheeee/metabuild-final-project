import { useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import useBooks from '../hooks/useBooks'
import { fetchBookShops as fetchBookShopsApi, fetchBookSummary as fetchBookSummaryApi } from '../api/bookApi'
import Spinner from '../../../shared/components/icons/Spinner'

function SearchPage() {

  /* ===============================
     구매 정보 상태
  =============================== */
  const [openBookId, setOpenBookId] = useState(null)
  const [shops, setShops] = useState({})
  const [loadingBookId, setLoadingBookId] = useState(null)

  const [summaries, setSummaries] = useState({})
  const [loadingSummaryIds, setLoadingSummaryIds] = useState({})

  const fetchBookShops = async (book) => {

    // Toggle close if already open
    if (openBookId === book.bookId) {
      setOpenBookId(null)
      return
    }

    // Use cached shops if already loaded
    if (shops[book.bookId]) {
      setOpenBookId(book.bookId)
      return
    }

    setLoadingBookId(book.bookId)

    try {
      const data = await fetchBookShopsApi(book.bookId, book.title)

      setShops(prev => ({
        ...prev,
        [book.bookId]: data
      }))

      setOpenBookId(book.bookId)

    } catch (e) {
      alert('구매 정보 조회 실패')
    } finally {
      setLoadingBookId(null)
    }
  }

  const fetchBookSummary = async (bookId) => {
    if (summaries[bookId]) {
      return
    }

    setLoadingSummaryIds(prev => ({
      ...prev,
      [bookId]: true
    }))

    try {
      const data = await fetchBookSummaryApi(bookId)
      setSummaries(prev => ({
        ...prev,
        [bookId]: data.summary
      }))
    } catch (e) {
      setSummaries(prev => ({
        ...prev,
        [bookId]: ''
      }))
    } finally {
      setLoadingSummaryIds(prev => ({
        ...prev,
        [bookId]: false
      }))
    }
  }

  /* ===============================
     검색 상태
  =============================== */
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const initialKeyword = params.get('keyword') || ''
  const [keyword, setKeyword] = useState(initialKeyword)

  const { books, loading } = useBooks(initialKeyword)

  const handleSearch = () => {
    if (!keyword.trim()) {
      alert('검색어를 입력해주세요')
      return
    }
    navigate(`/searchbook?keyword=${encodeURIComponent(keyword.trim())}`)
  }

  useEffect(() => {
    setKeyword(initialKeyword)
  }, [initialKeyword])

  if (loading) {
    return <div className="p-10">로딩 중...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-6">

      {/* ===============================
         검색창
      =============================== */}
      <div className="mt-10 mb-16 flex justify-center">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch()
          }}
          className="relative w-full max-w-4xl"
        >
          <input
            type="text"
            placeholder="도서명 또는 ISBN으로 검색하세요"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full h-16 pl-6 pr-16 text-lg rounded-full border border-gray-300"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gray-900 text-white"
          >
            검색
          </button>
        </form>
      </div>

      {/* ===============================
         검색결과
      =============================== */}
      <h2 className="text-2xl font-bold mb-10">
        {initialKeyword} 검색결과
      </h2>

      {books.length === 0 ? (
        <p className="text-gray-500">검색 결과가 없습니다.</p>
      ) : (
        <div className="space-y-12 mb-32">

          {books.map(book => {
            const bookShops = shops[book.bookId] || []
            const minPrice = bookShops.length
              ? Math.min(...bookShops.map(shop => shop.price))
              : null

            return (
              <div key={book.bookId}>

              {/* ===============================
                 도서 카드
              =============================== */}
              <div className="grid grid-cols-12 gap-6 bg-gray-100 rounded-2xl p-6">

                {/* 표지 */}
                <div className="col-span-12 md:col-span-3 flex flex-col items-center">
                  <div className="w-full aspect-[3/4] bg-gray-300 rounded-lg mb-4 flex items-center justify-center text-gray-500">
                    표지
                  </div>
                </div>

                {/* 도서 정보 */}
                <div className="col-span-12 md:col-span-6">
                  <h3 className="text-xl font-semibold mb-2">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-1">
                    저자 {book.author}
                  </p>
                  <p className="text-gray-600 text-sm mb-4">
                    출판사 {book.publisher}
                  </p>
                  <div
                    className="bg-white border rounded-lg px-4 py-2 text-sm text-gray-700 cursor-pointer flex items-center gap-2"
                    onClick={() => fetchBookSummary(book.bookId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchBookSummary(book.bookId)
                      }
                    }}
                  >
                    {loadingSummaryIds[book.bookId] && (
                      <Spinner className="w-4 h-4" />
                    )}
                    {loadingSummaryIds[book.bookId]
                      ? 'AI 요약 생성 중...'
                      : (summaries[book.bookId] || '클릭하면 AI 요약을 생성합니다')}
                  </div>
                </div>

                {/* 버튼 */}
                <div className="col-span-12 md:col-span-3 flex flex-col gap-3 justify-center">
                  <button className="w-full py-2 rounded-lg bg-gray-900 text-white text-sm">
                    대출 가능 도서관
                  </button>

                  <button
                    className="w-full py-2 rounded-lg bg-gray-800 text-white text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                    onClick={() => fetchBookShops(book)}
                    disabled={loadingBookId === book.bookId}
                  >
                    {loadingBookId === book.bookId && (
                      <Spinner className="w-4 h-4" />
                    )}
                    도서 구매 조회
                  </button>

                  <button className="w-full py-2 rounded-lg bg-gray-700 text-white text-sm">
                    관련 커뮤니티 게시글
                  </button>
                </div>
              </div>

              {/* ===============================
                 가격비교
              =============================== */}
              {openBookId === book.bookId && (
                <div className="mt-4 bg-white border rounded-xl p-5">

                  <h4 className="font-semibold mb-3">
                    최저가 비교 (온라인서점)
                  </h4>

                  {loadingBookId === book.bookId ? (
                    <p className="text-sm text-gray-500">불러오는 중...</p>
                  ) : bookShops.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      판매 정보가 없습니다.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {bookShops.map((shop, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-center border-b pb-2"
                        >
                          <span className="text-sm font-medium">
                            {shop.provider}
                            {minPrice !== null && shop.price === minPrice && (
                              <span className="ml-2 text-xs text-amber-600">
                                최저가
                              </span>
                            )}
                          </span>

                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm">
                              {shop.price.toLocaleString()}원
                            </span>
                            <a
                              href={shop.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              이동
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SearchPage
