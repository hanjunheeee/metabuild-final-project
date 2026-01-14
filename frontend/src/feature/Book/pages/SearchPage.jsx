import { useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import useBooks from '../hooks/useBooks'
import { fetchBookShops as fetchBookShopsApi, fetchBookSummary as fetchBookSummaryApi, fetchBooks } from '../api/bookApi'
import { logSearch, logBookAction } from '../api/analyticsApi'
import Spinner from '../../../shared/components/icons/Spinner'
import { getUserFromSession } from '@/shared/api/authApi'
import { fetchBookmarkedBookIds, toggleBookmark } from '@/shared/api/bookmarkApi'

// 도서 검색 결과 화면(요약/구매/대출 경로 제공)
function SearchPage() {

  /* ===============================
     구매 정보 상태
  =============================== */
  const [openBookId, setOpenBookId] = useState(null)
  const [shops, setShops] = useState({})
  const [loadingBookId, setLoadingBookId] = useState(null)

  const [summaries, setSummaries] = useState({})
  const [loadingSummaryIds, setLoadingSummaryIds] = useState({})
  const currentUser = getUserFromSession()
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const [bookmarkLoadingIds, setBookmarkLoadingIds] = useState(new Set())
  const [relatedOpenIds, setRelatedOpenIds] = useState(new Set())
  const [relatedBooks, setRelatedBooks] = useState({})
  const [relatedLoadingIds, setRelatedLoadingIds] = useState(new Set())
  const [relatedErrors, setRelatedErrors] = useState({})

  const decodeHtmlEntities = (value) => {
    if (!value || typeof value !== 'string') {
      return value || ''
    }
    const textarea = document.createElement('textarea')
    textarea.innerHTML = value
    return textarea.value
  }

  // 판매처 가격 조회(캐시 활용 + 토글)
  const fetchBookShops = async (book) => {

    // Toggle close if already open
    if (openBookId === book.bookId) {
      setOpenBookId(null)
      return
    }

    // 구매 조회 로그
    logBookAction(book.bookId, 'PURCHASE_VIEW')

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

  // LLM 요약 조회(결과 캐시)
  const fetchBookSummary = async (bookId) => {
    if (summaries[bookId]) {
      return
    }

    // AI 요약 로그
    logBookAction(bookId, 'AI_SUMMARY')

    setLoadingSummaryIds(prev => ({
      ...prev,
      [bookId]: true
    }))

    try {
      const data = await fetchBookSummaryApi(bookId)
      const decodedSummary = decodeHtmlEntities(data?.summary)
      setSummaries(prev => ({
        ...prev,
        [bookId]: decodedSummary
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

  const toggleRelatedBooks = async (book) => {
    const bookId = book?.bookId
    if (!bookId) return

    setRelatedOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(bookId)) {
        next.delete(bookId)
      } else {
        next.add(bookId)
      }
      return next
    })

    if (relatedBooks[bookId] || relatedLoadingIds.has(bookId)) {
      return
    }

    const terms = [book.author, book.title, book.publisher]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value) => value)
    if (terms.length === 0) return

    setRelatedLoadingIds((prev) => {
      const next = new Set(prev)
      next.add(bookId)
      return next
    })
    setRelatedErrors((prev) => ({ ...prev, [bookId]: '' }))

    try {
      const results = await Promise.allSettled(
        terms.map((term) => fetchBooks(term))
      )
      const merged = results.flatMap((result) => {
        if (result.status !== 'fulfilled') return []
        return Array.isArray(result.value) ? result.value : []
      })
      const unique = new Map()
      merged.forEach((item) => {
        if (!item?.bookId || item.bookId === bookId) return
        if (!unique.has(item.bookId)) {
          unique.set(item.bookId, item)
        }
      })
      const filtered = Array.from(unique.values()).slice(0, 6)
      setRelatedBooks((prev) => ({
        ...prev,
        [bookId]: filtered
      }))
    } catch (e) {
      setRelatedErrors((prev) => ({
        ...prev,
        [bookId]: '비슷한 책을 불러오지 못했습니다.'
      }))
    } finally {
      setRelatedLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(bookId)
        return next
      })
    }
  }

  // 알라딘 커버 이미지 크기 보정
  const getCoverUrl = (url) => {
    if (!url) {
      return ''
    }
    if (url.includes('image.aladin.co.kr') && url.includes('/coversum/')) {
      return url.replace('/coversum/', '/cover200/')
    }
    return url
  }

  // 지도 페이지로 이동하면서 책 정보 전달
  const goToLibrarySearch = (book) => {
    // 도서관 검색 로그
    logBookAction(book.bookId, 'LIBRARY_SEARCH')
    
    const params = new URLSearchParams()
    if (book.title) {
      params.set('title', book.title)
    }
    if (book.isbn) {
      params.set('isbn', book.isbn)
    }
    const queryString = params.toString()
    navigate(`/library/map${queryString ? `?${queryString}` : ''}`)
  }

  // 커뮤니티 리뷰 목록으로 이동
  const goToCommunityReviews = (book) => {
    const params = new URLSearchParams()
    params.set('kind', 'REVIEW')
    const title = (book?.title || initialKeyword || '').trim()
    if (title) {
      params.set('query', title)
    }
    navigate(`/community?${params.toString()}`)
  }

  /* ===============================
     검색 상태
  =============================== */
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const initialKeyword = params.get('keyword') || ''
  const [keyword, setKeyword] = useState(initialKeyword)
  const [visibleCount, setVisibleCount] = useState(10)

  const { books, loading } = useBooks(initialKeyword)

  // 검색 결과의 첫 번째 책 제목 (ISBN 검색 시 변환용)
  const firstBookTitle = books.length > 0 ? books[0].title : null

  // 검색 로그 전송 (검색 결과 로드 후)
  // 검색 결과 로딩 후 검색 로그 전송
  useEffect(() => {
    if (initialKeyword && books.length > 0) {
      logSearch(initialKeyword, firstBookTitle)
    }
  }, [initialKeyword, books.length, firstBookTitle])

  // 검색어 변경 시 URL 갱신
  const handleSearch = () => {
    if (!keyword.trim()) {
      alert('검색어를 입력해주세요')
      return
    }
    navigate(`/searchbook?keyword=${encodeURIComponent(keyword.trim())}`)
  }

  // URL 키워드 변경 시 입력/페이지 초기화
  useEffect(() => {
    setKeyword(initialKeyword)
    setVisibleCount(10)
  }, [initialKeyword])

  useEffect(() => {
    if (!currentUser?.userId) {
      setBookmarkedIds(new Set())
      return
    }

    let cancelled = false
    fetchBookmarkedBookIds(currentUser.userId)
      .then((ids) => {
        if (cancelled) return
        setBookmarkedIds(new Set(Array.isArray(ids) ? ids : []))
      })
      .catch(() => {
        if (cancelled) return
        setBookmarkedIds(new Set())
      })

    return () => {
      cancelled = true
    }
  }, [currentUser?.userId])

  const handleToggleBookmark = async (bookId) => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    if (!bookId) return

    setBookmarkLoadingIds((prev) => {
      const next = new Set(prev)
      next.add(bookId)
      return next
    })

    try {
      const result = await toggleBookmark(currentUser.userId, bookId)
      setBookmarkedIds((prev) => {
        const next = new Set(prev)
        if (result?.bookmarked) {
          next.add(bookId)
        } else {
          next.delete(bookId)
        }
        return next
      })
    } catch (e) {
      alert('즐겨찾기 처리에 실패했습니다.')
    } finally {
      setBookmarkLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(bookId)
        return next
      })
    }
  }

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
            placeholder="도서명, 저자명 또는 ISBN으로 검색하세요"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            maxLength={20}
            className="w-full h-16 pl-6 pr-28 text-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-sub-bg focus:border-sub-bg"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-7 py-3 bg-sub-bg text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            검색
          </button>
        </form>
      </div>

      {/* ===============================
         검색결과
      =============================== */}
      <h2 className="text-2xl font-extrabold mb-10 text-sub-bg">
        "{initialKeyword}"<span className="text-gray-500 text-base ml-2">검색결과</span>
      </h2>

      {books.length === 0 ? (
        <p className="text-gray-500">검색 결과가 없습니다.</p>
      ) : (
        <div className="space-y-12 mb-32">

          {books.slice(0, visibleCount).map(book => {
            const bookShops = shops[book.bookId] || []
            const minPrice = bookShops.length
              ? Math.min(...bookShops.map(shop => shop.price))
              : null
            const isBookmarked = bookmarkedIds.has(book.bookId)
            const isBookmarkLoading = bookmarkLoadingIds.has(book.bookId)
            const isRelatedOpen = relatedOpenIds.has(book.bookId)
            const relatedList = relatedBooks[book.bookId] || []
            const isRelatedLoading = relatedLoadingIds.has(book.bookId)
            const relatedError = relatedErrors[book.bookId]

            return (
              <div key={book.bookId}>

              {/* ===============================
                 도서 카드
              =============================== */}
              <div className="grid grid-cols-12 gap-6 bg-gray-50 border border-gray-200 p-6 shadow-sm">

                {/* 표지 */}
                <div className="col-span-12 md:col-span-3 flex flex-col items-center">
                  {book.imageUrl ? (
                    <img
                      src={getCoverUrl(book.imageUrl)}
                      alt={book.title || 'cover'}
                      className="w-full aspect-[3/4] object-cover rounded-lg mb-4 bg-gray-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-gray-300 rounded-lg mb-4 flex items-center justify-center text-gray-500">
                      표지
                    </div>
                  )}
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
                    className="bg-white border px-4 py-3 text-sm text-gray-700 cursor-pointer"
                    onClick={() => fetchBookSummary(book.bookId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchBookSummary(book.bookId)
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          AI 요약
                        </span>
                        
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {loadingSummaryIds[book.bookId] && (
                          <Spinner className="w-4 h-4" />
                        )}
                        {loadingSummaryIds[book.bookId] ? '생성 중' : '클릭해서 보기'}
                      </div>
                    </div>
                    <div className="mt-2 rounded-md bg-emerald-50/60 px-3 py-2 text-gray-700 leading-relaxed">
                      {loadingSummaryIds[book.bookId]
                        ? 'AI가 책의 핵심을 정리하고 있어요...'
                        : (summaries[book.bookId] || '핵심 요약을 보고 싶다면 여기를 눌러주세요.')}
                    </div>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="col-span-12 md:col-span-3 flex flex-col gap-3 justify-center">
                  <button
                    type="button"
                    className={`w-full py-2 text-sm flex items-center justify-center gap-2 cursor-pointer transition-opacity ${
                      isBookmarked
                        ? 'bg-yellow-400 text-white hover:bg-yellow-500'
                        : 'bg-white border border-gray-300 text-gray-600 hover:border-yellow-400 hover:text-yellow-600'
                    }`}
                    onClick={() => handleToggleBookmark(book.bookId)}
                    disabled={isBookmarkLoading}
                    title={isBookmarked ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                  >
                    {isBookmarked ? '즐겨찾기 해제' : '즐겨찾기'}
                  </button>
                  <button
                    className="w-full py-2 bg-sub-bg text-white text-sm cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => goToLibrarySearch(book)}
                  >
                    대출 가능 도서관
                  </button>

                  <button
                    className="w-full py-2 bg-main-bg text-white text-sm flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => fetchBookShops(book)}
                    disabled={loadingBookId === book.bookId}
                  >
                    {loadingBookId === book.bookId && (
                      <Spinner className="w-4 h-4" />
                    )}
                    도서 구매 조회
                  </button>

                  <button
                    className="w-full py-2 bg-gray-500 text-white text-sm cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => goToCommunityReviews(book)}
                  >
                    관련 커뮤니티 게시글
                  </button>
                  <button
                    className="w-full py-2 bg-white border border-gray-300 text-sm text-gray-700 cursor-pointer hover:border-sub-bg hover:text-sub-bg transition-colors"
                    onClick={() => toggleRelatedBooks(book)}
                  >
                    {isRelatedOpen ? '비슷한 책 접기' : '비슷한 책 더보기'}
                  </button>
                </div>
              </div>

              {/* ===============================
                 가격비교
              =============================== */}
              {openBookId === book.bookId && (
                <div className="mt-4 bg-white border border-gray-200 p-5">

                  <h4 className="font-semibold mb-3 text-gray-800">
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

              {isRelatedOpen && (
                <div className="mt-4 bg-white border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">
                      비슷한 책
                    </h4>
                    <button
                      type="button"
                      className="text-xs text-gray-500 hover:text-sub-bg"
                      onClick={() =>
                        navigate(`/searchbook?keyword=${encodeURIComponent(book.author || book.title || '')}`)
                      }
                    >
                      전체 보기
                    </button>
                  </div>

                  {isRelatedLoading && (
                    <p className="text-sm text-gray-500">불러오는 중...</p>
                  )}
                  {!isRelatedLoading && relatedError && (
                    <p className="text-sm text-red-500">{relatedError}</p>
                  )}
                  {!isRelatedLoading && !relatedError && relatedList.length === 0 && (
                    <p className="text-sm text-gray-500">비슷한 책이 없습니다.</p>
                  )}
                  {!isRelatedLoading && !relatedError && relatedList.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {relatedList.map((item) => (
                        <button
                          key={item.bookId}
                          className="text-left hover:opacity-90 transition-opacity"
                          onClick={() => navigate(`/searchbook?keyword=${encodeURIComponent(item.title || '')}`)}
                        >
                          {item.imageUrl ? (
                            <img
                              src={getCoverUrl(item.imageUrl)}
                              alt={item.title || 'cover'}
                              className="w-full aspect-[3/4] object-cover rounded bg-gray-200"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full aspect-[3/4] bg-gray-200 rounded" />
                          )}
                          <p className="mt-2 text-xs text-gray-700 line-clamp-2">
                            {item.title}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
            )
          })}
          {books.length > visibleCount && (
            <div className="border border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-sm text-gray-600 mb-3">
                검색 결과가 많아 {visibleCount}개만 보여드렸습니다.
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-sub-bg text-white text-sm cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setVisibleCount(prev => prev + 20)}
              >
                더보기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchPage
