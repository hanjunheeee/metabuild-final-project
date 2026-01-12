import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchAladinBestsellers,
  fetchKyoboBestsellers,
  fetchYes24Bestsellers,
  fetchSeoulLoanTop10
} from '../api/bookApi'
import { fetchCommunities } from '@/feature/Community/api/communityApi'
import useCommunityHelpers from '@/feature/Community/hooks/useCommunityHelpers'

function MainPage() {
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

  const [loanRankingBooks, setLoanRankingBooks] = useState([])

  const fallbackLoanRankingBooks = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `???????????? ??? ${i + 1}`,
  }))

  const rankingBooks = loanRankingBooks.length ? loanRankingBooks : fallbackLoanRankingBooks

  const maxPage = Math.ceil(rankingBooks.length / booksPerPage) - 1

  const visibleRankingBooks = rankingBooks.slice(
    page * booksPerPage,
    page * booksPerPage + booksPerPage
  )

  useEffect(() => {
    let cancelled = false

    fetchSeoulLoanTop10()
      .then((data) => {
        if (cancelled) return
        setLoanRankingBooks(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (cancelled) return
      })
      .finally(() => {
        if (cancelled) return
      })

    return () => {
      cancelled = true
    }
  }, [])

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

  const { getPostTitle } = useCommunityHelpers()
  const [communityPosts, setCommunityPosts] = useState([])
  const [communityLoading, setCommunityLoading] = useState(false)
  const [communityError, setCommunityError] = useState('')

  useEffect(() => {
    let cancelled = false
    setCommunityLoading(true)
    setCommunityError('')

    fetchCommunities()
      .then((data) => {
        if (cancelled) return
        setCommunityPosts(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (cancelled) return
        setCommunityError('COMMUNITY_FETCH_FAILED')
      })
      .finally(() => {
        if (cancelled) return
        setCommunityLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const getCommunitySortTime = (post) => {
    const dateValue = post?.createdAt || post?.updatedAt
    return dateValue ? new Date(dateValue).getTime() : 0
  }

  const isNoticePost = (post) => Number(post?.isNotice) === 1

  const { noticePosts, regularPosts } = useMemo(() => {
    const notices = communityPosts
      .filter((post) => isNoticePost(post))
      .sort((a, b) => getCommunitySortTime(b) - getCommunitySortTime(a))
      .slice(0, 3)
    const regulars = communityPosts.filter((post) => !isNoticePost(post))
    return { noticePosts: notices, regularPosts: regulars }
  }, [communityPosts])

  const latestCommunityPosts = useMemo(() => {
    return [...regularPosts]
      .sort((a, b) => getCommunitySortTime(b) - getCommunitySortTime(a))
      .slice(0, 5)
  }, [regularPosts])

  const topCommunityPosts = useMemo(() => {
    return [...regularPosts]
      .sort((a, b) => (b.communityGreat || 0) - (a.communityGreat || 0))
      .slice(0, 3)
  }, [regularPosts])

  const popularCommunityIds = useMemo(() => {
    return new Set(topCommunityPosts.map((post) => post.communityId))
  }, [topCommunityPosts])

  const mainCommunityPosts = useMemo(() => {
    const combined = [...noticePosts, ...latestCommunityPosts]
    const seen = new Set()
    const deduped = []

    combined.forEach((post) => {
      if (!post?.communityId || seen.has(post.communityId)) return
      seen.add(post.communityId)
      deduped.push(post)
    })

    return deduped.slice(0, 7)
  }, [noticePosts, latestCommunityPosts])

  const handleCommunityClick = (communityId) => {
    if (!communityId) return
    navigate(`/community/${communityId}`)
  }

  const getCommunityKindLabel = (post) => {
    if (isNoticePost(post)) return '\uACF5\uC9C0'
    switch (post?.communityKind) {
      case 'QUESTION':
        return '\uC9C8\uBB38'
      case 'REVIEW':
        return '\uB9AC\uBDF0'
      case 'FREE':
        return '\uC790\uC720'
      default:
        return '\uC790\uC720'
    }
  }

  const getCommunityKindStyle = (post) => {
    if (isNoticePost(post)) return 'bg-orange-100 text-orange-700'
    switch (post?.communityKind) {
      case 'QUESTION':
        return 'bg-purple-100 text-purple-700'
      case 'REVIEW':
        return 'bg-green-100 text-green-700'
      case 'FREE':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6">
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
        ].map(provider => {
          const isActive = provider.value === bestSellerProvider
          const baseColor =
            provider.value === 'KYOBO'
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : provider.value === 'YES24'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-fuchsia-600 hover:bg-fuchsia-700'
          return (
            <button
              key={provider.value}
              onClick={() => { setBestPage(0); setBestSellerProvider(provider.value) }}
              className={`
                px-5
                py-2
                rounded-full
                text-white
                text-sm
                border-2
                ${baseColor}
                ${isActive ? 'border-gray-900 shadow-[0_0_0_2px_rgba(17,24,39,0.15)]' : 'border-transparent'}
              `}
            >
              {provider.label}
            </button>
          )
        })}

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
         커뮤니티 & 트렌드 (인기글 / 최신글)
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
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="text-sm text-gray-500 hover:underline"
              >
                더보기
              </button>
            </div>

            <div className="relative h-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100/80 p-6 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.45)]">
              <div className="pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full bg-emerald-100/50 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-sky-100/50 blur-3xl" />
              <ul className="relative space-y-3 text-gray-700 text-sm">
                {communityLoading && (
                  <li className="text-gray-500">로딩 중...</li>
                )}
                {!communityLoading && communityError && (
                  <li className="text-red-500">커뮤니티를 불러오지 못했습니다</li>
                )}
                {!communityLoading && !communityError && mainCommunityPosts.length === 0 && (
                  <li className="text-gray-500">커뮤니티 게시글이 없습니다</li>
                )}
                                                {mainCommunityPosts.map((post) => {
                  const isPopular = popularCommunityIds.has(post.communityId)
                  const kindLabel = getCommunityKindLabel(post)
                  const kindClass = getCommunityKindStyle(post)

                  return (
                    <li key={post.communityId}>
                      <button
                        type="button"
                        onClick={() => handleCommunityClick(post.communityId)}
                        className="w-full text-left hover:underline line-clamp-1"
                      >
                        {isPopular && (
                          <span className="mr-1 inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                            HOT
                          </span>
                        )}
                        <span className={`mr-1 inline-flex items-center rounded-full ${kindClass} px-2 py-0.5 text-xs font-semibold`}>
                          [{kindLabel}]
                        </span>
                        {getPostTitle(post)}
                      </button>
                    </li>
                  )
                })}
</ul>
            </div>
          </div>

          {/* 트렌드 */}
          <div className="col-span-12 lg:col-span-4">
            <h3 className="text-xl font-semibold mb-4">검색어 트렌드</h3>
            <div className="h-[260px] rounded-2xl bg-gray-200 flex items-center justify-center text-gray-500">
              트렌드 준비중
            </div>
          </div>

          {/* 트렌드 도서 TOP3 */}
          <div className="col-span-12 lg:col-span-3">
            <h3 className="text-xl font-semibold mb-4">트렌드 도서 TOP 3</h3>
            <div className="h-[260px] rounded-2xl bg-gray-200 flex items-center justify-center text-gray-700 text-center px-6">
              트렌드 도서 TOP 3<br />
              준비중
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default MainPage
