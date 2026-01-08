import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAladinBestsellers, fetchKyoboBestsellers, fetchYes24Bestsellers } from '../api/bookApi'

function MainPage() {
  const moodKeywords = [
    { label: '밝은 분위기 좋아요', keyword: '밝은 소설' },
    { label: '마음을 복잡하게', keyword: '힐링 에세이' },
    { label: '짧게 읽기 좋아요', keyword: '짧은 소설' },
    { label: '가볍게 생각 바꾸기', keyword: '처음 에세이' },
  ]

  /* ===============================
     통합 검색
  =============================== */
  const [keyword, setKeyword] = useState('')
  const navigate = useNavigate()

  const handleSearch = () => {
    if (!keyword.trim()) {
      alert('검색어를 입력해주세요')
      return
    }
    navigate(`/searchbook?keyword=${encodeURIComponent(keyword.trim())}`)
  }

  /* ===============================
     서울시 월간 대출랭킹
  =============================== */
  const [page, setPage] = useState(0)
  const booksPerPage = 5

  const rankingBooks = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `서울시 대출 랭킹 도서 ${i + 1}`,
  }))

  const maxPage = Math.ceil(rankingBooks.length / booksPerPage) - 1

  const visibleRankingBooks = rankingBooks.slice(
    page * booksPerPage,
    page * booksPerPage + booksPerPage
  )

  /* ===============================
     서점별 베스트셀러 TOP10
  =============================== */
  const [bestSellerProvider, setBestSellerProvider] = useState('ALADIN')
  const [bestSellerMap, setBestSellerMap] = useState({ ALADIN: [], KYOBO: [], YES24: [] })
  const [bestSellerLoading, setBestSellerLoading] = useState(false)
  const [bestSellerError, setBestSellerError] = useState('')

  const [bestPage, setBestPage] = useState(0)
  const bestBooksPerPage = 5

  const fallbackBestSellerBooks = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `??? ????????TOP ${i + 1}`,
  }))

  const bestSellerBooks = bestSellerMap[bestSellerProvider] || []
  const bestSellerSource = bestSellerBooks.length ? bestSellerBooks : fallbackBestSellerBooks
  const bestMaxPage = Math.max(0, Math.ceil(bestSellerSource.length / bestBooksPerPage) - 1)

  const visibleBestSellerBooks = bestSellerSource.slice(
    bestPage * bestBooksPerPage,
    bestPage * bestBooksPerPage + bestBooksPerPage
  )
  useEffect(() => {
    let cancelled = false
    setBestSellerLoading(true)

    Promise.allSettled([
      fetchAladinBestsellers(),
      fetchKyoboBestsellers(),
      fetchYes24Bestsellers()
    ])
      .then(results => {
        if (cancelled) return
        const [aladin, kyobo, yes24] = results
        if (aladin.status === 'fulfilled') {
          setBestSellerMap(prev => ({ ...prev, ALADIN: Array.isArray(aladin.value) ? aladin.value : [] }))
        }
        if (kyobo.status === 'fulfilled') {
          setBestSellerMap(prev => ({ ...prev, KYOBO: Array.isArray(kyobo.value) ? kyobo.value : [] }))
        }
        if (yes24.status === 'fulfilled') {
          setBestSellerMap(prev => ({ ...prev, YES24: Array.isArray(yes24.value) ? yes24.value : [] }))
        }
      })
      .catch(() => {
        if (cancelled) return
        setBestSellerError('BESTSELLER_FETCH_FAILED')
      })
      .finally(() => {
        if (cancelled) return
        setBestSellerLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* ===============================
         분위기 추천 검색
      =============================== */}
      <div className="mb-16 flex flex-wrap justify-center gap-4">
        {moodKeywords.map(item => (
          <button
            key={item.label}
            onClick={() =>
              navigate(`/searchbook?keyword=${encodeURIComponent(item.keyword)}`)
            }
            className="
              px-6 py-3
              rounded-full
              bg-gray-100
              text-gray-800
              text-sm
              border
              hover:bg-gray-900
              hover:text-white
              transition
            "
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ===============================
         메인 검색바
      =============================== */}
      <div className="mt-16 mb-24 flex justify-center">
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
            className="
              w-full
              h-16
              pl-6
              pr-16
              text-lg
              rounded-full
              border
              border-gray-300
              focus:outline-none
              focus:ring-2
              focus:ring-gray-900
            "
          />

          <button
            type="submit"
            className="
              absolute
              right-2
              top-1/2
              -translate-y-1/2
              w-12
              h-12
              rounded-full
              bg-gray-900
              text-white
              flex
              items-center
              justify-center
              hover:opacity-90
            "
          >
            검색
          </button>
        </form>
      </div>

      {/* ===============================
         서울시 월간 대출랭킹
      =============================== */}
      <section className="mb-32">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">
          서울시 도서관 월간 대출랭킹
        </h2>

        {/* 카테고리 */}
        <div className="flex gap-3 mb-8">
          {['전체', '아동','청소년', '성인'].map(label => (
            <button
              key={label}
              onClick={() => setPage(0)}
              className="
                px-5
                py-2
                rounded-full
                bg-gray-900
                text-white
                text-sm
                hover:opacity-90
              "
            >
              {label}
            </button>
          ))}
        </div>

        {/* 슬라이더 */}
        <div className="relative">
          {/* 이전 */}
          <button
            onClick={() => setPage(p => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="
              absolute
              -left-14
              top-1/2
              -translate-y-1/2
              w-10
              h-10
              rounded-full
              bg-gray-200
              flex
              items-center
              justify-center
              disabled:opacity-30
            "
          >
            ‹
          </button>

          {/* 카드 */}
          <div className="grid grid-cols-5 gap-6">
            {visibleRankingBooks.map(book => (
              <div
                key={book.isbn13 || book.title || book.id}
                className="flex flex-col items-center cursor-pointer"
                onClick={() =>
                  navigate(`/searchbook?keyword=${encodeURIComponent(book.title)}`)
                }
              >
                {book.cover ? (
                  <img
                    src={book.cover}
                    alt={book.title || 'cover'}
                    className="w-full aspect-[3/4] object-cover rounded-lg mb-3 bg-gray-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-gray-300 rounded-lg mb-3" />
                )}
                <p className="text-sm text-gray-800 text-center line-clamp-2">
                  {book.title}
                </p>
              </div>
            ))}
          </div>

          {/* 다음 */}
          <button
            onClick={() => setPage(p => Math.min(p + 1, maxPage))}
            disabled={page === maxPage}
            className="
              absolute
              -right-14
              top-1/2
              -translate-y-1/2
              w-10
              h-10
              rounded-full
              bg-gray-200
              flex
              items-center
              justify-center
              disabled:opacity-30
            "
          >
            ›
          </button>
        </div>
      </section>

      {/* ===============================
         서점별 베스트셀러 TOP10
      =============================== */}
      <section className="mb-32">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">
          서점 별 베스트셀러 TOP10
        </h2>

        {/* 서점 카테고리 */}
        <div className="flex gap-3 mb-8">
          {[
          { label: '\uAD50\uBCF4\uBB38\uACE0', value: 'KYOBO' },
          { label: '\uC54C\uB77C\uB518', value: 'ALADIN' },
          { label: 'YES24', value: 'YES24' }
        ].map(provider => (
            <button
              key={provider.value}
              onClick={() => { setBestPage(0); setBestSellerProvider(provider.value) }}
              className="
                px-5
                py-2
                rounded-full
                bg-gray-900
                text-white
                text-sm
                hover:opacity-90
              "
            >
              {provider.label}
            </button>
          ))}
        </div>

        {/* 슬라이더 */}
        <div className="relative">
          <button
            onClick={() => setBestPage(p => Math.max(p - 1, 0))}
            disabled={bestPage === 0}
            className="
              absolute
              -left-14
              top-1/2
              -translate-y-1/2
              w-10
              h-10
              rounded-full
              bg-gray-200
              flex
              items-center
              justify-center
              disabled:opacity-30
            "
          >
            ‹
          </button>

          <div className="grid grid-cols-5 gap-6">
            {visibleBestSellerBooks.map(book => (
              <div
                key={book.isbn13 || book.title || book.id}
                className="flex flex-col items-center cursor-pointer"
                onClick={() =>
                  navigate(`/searchbook?keyword=${encodeURIComponent(book.title)}`)
                }
              >
                {book.cover ? (
                  <img
                    src={book.cover}
                    alt={book.title || 'cover'}
                    className="w-full aspect-[3/4] object-cover rounded-lg mb-3 bg-gray-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-gray-300 rounded-lg mb-3" />
                )}
                <p className="text-sm text-gray-800 text-center line-clamp-2">
                  {book.title}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setBestPage(p => Math.min(p + 1, bestMaxPage))}
            disabled={bestPage === bestMaxPage}
            className="
              absolute
              -right-14
              top-1/2
              -translate-y-1/2
              w-10
              h-10
              rounded-full
              bg-gray-200
              flex
              items-center
              justify-center
              disabled:opacity-30
            "
          >
            ›
          </button>
        </div>
      </section>

      {/* ===============================
         하단 정보 영역 (커뮤니티 / 트렌드)
      =============================== */}
      <section className="mb-32">
        <h2 className="text-3xl font-bold mb-10 text-gray-900">
          커뮤니티 & 트렌드
        </h2>

        <div className="grid grid-cols-12 gap-8">
          {/* 커뮤니티 */}
          <div className="col-span-12 lg:col-span-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">커뮤니티</h3>
              <button className="text-sm text-gray-500 hover:underline">더보기</button>
            </div>

            <div className="h-[260px] rounded-2xl bg-gray-200 p-6">
              <ul className="space-y-3 text-gray-500 text-sm">
                <li>인기 게시글 1</li>
                <li>인기 게시글 2</li>
                <li>인기 게시글 3</li>
                <li>게시글</li>
                <li>게시글</li>
                <li>게시글</li>
              </ul>
            </div>
          </div>

          {/* 트렌드 */}
          <div className="col-span-12 lg:col-span-4">
            <h3 className="text-xl font-semibold mb-4">파워 트렌드</h3>
            <div className="h-[260px] rounded-2xl bg-gray-200 flex items-center justify-center text-gray-500">
              파워 트렌드
            </div>
          </div>

          {/* 인기 책 TOP3 */}
          <div className="col-span-12 lg:col-span-3">
            <h3 className="text-xl font-semibold mb-4">인기 책 TOP 3</h3>
            <div className="h-[260px] rounded-2xl bg-gray-200 flex items-center justify-center text-gray-700 text-center px-6">
              파워 검색량으로<br />
              인기 책 TOP 3
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default MainPage