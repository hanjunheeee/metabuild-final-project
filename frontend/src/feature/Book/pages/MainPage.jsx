import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import cloud from 'd3-cloud'
import {
  fetchAladinBestsellers,
  fetchKyoboBestsellers,
  fetchYes24Bestsellers,
  fetchSeoulLoanTop10
} from '../api/bookApi'
import { fetchKeywordTrends, fetchPurchaseTrends } from '../api/analyticsApi'
import { fetchCommunities } from '@/feature/Community/api/communityApi'
import useCommunityHelpers from '@/feature/Community/hooks/useCommunityHelpers'
import { getUserFromSession } from '@/shared/api/authApi'
import { fetchBookmarkedBookIds, toggleBookmark } from '@/shared/api/bookmarkApi'
import { AlertModal } from '@/shared/components'
import { useAlertModal } from '@/shared/hooks'

// 키워드 트렌드 데이터를 워드클라우드로 렌더링
function WordCloud({ words, onWordClick }) {
  const containerRef = useRef(null)
  const [layoutWords, setLayoutWords] = useState([])
  const [size, setSize] = useState({ width: 0, height: 0 })

  // 컨테이너 사이즈를 추적해 레이아웃 계산에 반영
  useEffect(() => {
    if (!containerRef.current) return
    const updateSize = () => {
      const rect = containerRef.current.getBoundingClientRect()
      if (rect.width && rect.height) {
        setSize({ width: rect.width, height: rect.height })
      }
    }
    updateSize()
    const observer = new ResizeObserver(() => updateSize())
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // 단어 데이터와 사이즈에 맞춰 워드클라우드 레이아웃 계산
  useEffect(() => {
    if (!size.width || !size.height || words.length === 0) {
      setLayoutWords([])
      return
    }

    const maxValue = Math.max(...words.map((w) => w.value || 1), 1)
    const palette = [
      '#e11d48', '#2563eb', '#059669', '#f59e0b',
      '#7c3aed', '#0ea5e9', '#be123c', '#10b981',
      '#f97316', '#334155'
    ]

    cloud()
      .size([size.width, size.height])
      .words(words.map((w, idx) => ({
        text: w.text,
        value: w.value || 1,
        size: 14 + ((w.value || 1) / maxValue) * 18,
        rotate: idx % 5 === 0 ? 90 : 0,
        color: palette[idx % palette.length]
      })))
      .padding(2)
      .rotate((d) => d.rotate)
      .font('sans-serif')
      .fontSize((d) => d.size)
      .on('end', (result) => setLayoutWords(result))
      .start()
  }, [words, size.width, size.height])

  return (
    <div ref={containerRef} className="h-full w-full">
      {layoutWords.length > 0 && (
        <svg width="100%" height="100%" viewBox={`${-size.width / 2} ${-size.height / 2} ${size.width} ${size.height}`}>
          {layoutWords.map((w) => (
            <text
              key={`${w.text}-${w.x}-${w.y}`}
              textAnchor="middle"
              transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
              style={{ fontSize: `${w.size}px`, fontFamily: 'sans-serif', fill: w.color, opacity: 0.85, cursor: 'pointer' }}
              onClick={() => onWordClick?.(w.text)}
            >
              {w.text}
            </text>
          ))}
        </svg>
      )}
    </div>
  )
}

// 긴 제목을 2줄로 보이도록 자르기
function TwoLineTitle({ text, className = '' }) {
  return (
    <p
      title={text}
      className={`line-clamp-2 break-keep ${className}`}
    >
      {text}
    </p>
  )
}

// 메인페이지 데이터 로드/상태 관리
function MainPage() {
  /* ===============================
     통합 검색
  =============================== */
  const [keyword, setKeyword] = useState('')
  const navigate = useNavigate()
  const currentUser = getUserFromSession()
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const [bookmarkLoadingIds, setBookmarkLoadingIds] = useState(new Set())
  const { alertModal, showAlert, closeAlert } = useAlertModal()

  // 검색어 입력 후 검색 결과 페이지로 이동
  const handleSearch = () => {
    if (!keyword.trim()) {
      showAlert('알림', '검색어를 입력해주세요', 'warning')
      return
    }
    navigate(`/searchbook?keyword=${encodeURIComponent(keyword.trim())}`)
  }

  const formatDisplayTitle = (title) => {
    if (!title) return ''
    return title
      .replace(/[-:]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

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

  /* ===============================
     서울시 월간 대출랭킹
  =============================== */
  const [page, setPage] = useState(0)
  const booksPerPage = 5

  const [loanRankingBooks, setLoanRankingBooks] = useState([])

  const fallbackLoanRankingBooks = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `대출 랭킹 도서 ${i + 1}`,
  }))

  const rankingBooks = loanRankingBooks.length ? loanRankingBooks : fallbackLoanRankingBooks

  const maxPage = Math.ceil(rankingBooks.length / booksPerPage) - 1

  const visibleRankingBooks = rankingBooks.slice(
    page * booksPerPage,
    page * booksPerPage + booksPerPage
  )

  // 서울 대출 랭킹 데이터 로드
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
    title: `베스트셀러 TOP ${i + 1}`,
  }))

  const bestSellerBooks = bestSellerMap[bestSellerProvider] || []
  const bestSellerSource = bestSellerBooks.length ? bestSellerBooks : fallbackBestSellerBooks
  const bestMaxPage = Math.max(0, Math.ceil(bestSellerSource.length / bestBooksPerPage) - 1)

  const visibleBestSellerBooks = bestSellerSource.slice(
    bestPage * bestBooksPerPage,
    bestPage * bestBooksPerPage + bestBooksPerPage
  )
  // 알라딘/교보/YES24 베스트셀러 병렬 로드
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

  /* ===============================
     검색어 트렌드 (워드클라우드)
  =============================== */
  const [keywordTrends, setKeywordTrends] = useState([])
  const [trendBooks, setTrendBooks] = useState([])
  const [trendLoading, setTrendLoading] = useState(false)

  // 워드클라우드 입력 데이터 구성
  const wordCloudItems = useMemo(() => {
    return keywordTrends
      .slice(0, 10)
      .map((trend, idx) => ({
        text: trend.text || '',
        value: typeof trend.value === 'number' ? trend.value : 1,
        index: idx
      }))
      .filter((item) => item.text)
  }, [keywordTrends])

  // 검색어 트렌드 + 구매 트렌드 로드
  useEffect(() => {
    let cancelled = false
    setTrendLoading(true)

    Promise.allSettled([
      fetchKeywordTrends(),
      fetchPurchaseTrends()
    ])
      .then(([keywordResult, purchaseResult]) => {
        if (cancelled) return
        if (keywordResult.status === 'fulfilled') {
          setKeywordTrends(Array.isArray(keywordResult.value) ? keywordResult.value : [])
        }
        if (purchaseResult.status === 'fulfilled') {
          setTrendBooks(Array.isArray(purchaseResult.value) ? purchaseResult.value.slice(0, 3) : [])
        }
      })
      .finally(() => {
        if (cancelled) return
        setTrendLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const { getPostTitle } = useCommunityHelpers()
  const [communityPosts, setCommunityPosts] = useState([])
  const [communityLoading, setCommunityLoading] = useState(false)
  const [communityError, setCommunityError] = useState('')

  // 커뮤니티 목록 로드
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

  // 공지 여부/정렬 기준 헬퍼
  const getCommunitySortTime = (post) => {
    const dateValue = post?.createdAt || post?.updatedAt
    return dateValue ? new Date(dateValue).getTime() : 0
  }

  const isNoticePost = (post) => Number(post?.isNotice) === 1

  // 공지/일반 글 분리 및 최신 글 구성
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

  // 좋아요 기준 인기 글 집계
  const topCommunityPosts = useMemo(() => {
    return [...regularPosts]
      .sort((a, b) => (b.communityGreat || 0) - (a.communityGreat || 0))
      .slice(0, 3)
  }, [regularPosts])

  const popularCommunityIds = useMemo(() => {
    return new Set(topCommunityPosts.map((post) => post.communityId))
  }, [topCommunityPosts])

  // 공지+최신 글을 합쳐 중복 제거
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

  // 커뮤니티 분류 라벨/스타일 매핑
  const getCommunityKindLabel = (post) => {
    if (isNoticePost(post)) return '공지'
    switch (post?.communityKind) {
      case 'QUESTION':
        return '질문'
      case 'REVIEW':
        return '리뷰'
      case 'FREE':
        return '자유'
      default:
        return '자유'
    }
  }

  // 커뮤니티 분류별 배지 스타일
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
      <div className="mt-12 mb-8 text-center">
        <p className="text-base text-gray-600">
          한 곳에서{' '}
          <span className="font-semibold text-emerald-700">책 검색</span>,{' '}
          <span className="font-semibold text-sky-700">도서관 대출 정보</span>,{' '}
          <span className="font-semibold text-amber-700">베스트셀러</span>,{' '}
          <span className="font-semibold text-rose-700">트렌드</span>를 확인하세요!
        </p>
      </div>

      <div className="mb-12 flex justify-center">
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
            maxLength={30}
            className="
              w-full
              h-16
              pl-6
              pr-28
              text-lg
              border
              border-gray-300
              bg-white
              focus:outline-none
              focus:ring-2
              focus:ring-sub-bg
              focus:border-sub-bg
            "
          />

          <button
            type="submit"
            className="
              absolute
              right-2
              top-1/2
              -translate-y-1/2
              px-7
              py-3
              bg-sub-bg
              text-white
              text-sm
              font-medium
              flex
              items-center
              justify-center
              hover:opacity-90
              transition-opacity
              cursor-pointer
            "
          >
            검색
          </button>
        </form>
      </div>

      {/* ===============================
         서울시 월간 대출랭킹
      =============================== */}
      <section className="mb-12 border border-gray-200 bg-gray-50 p-8">
        <h2 className="text-2xl font-extrabold mb-6 text-sub-bg">
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
              bg-white
              border
              border-gray-300
              flex
              items-center
              justify-center
              disabled:opacity-30
              hover:bg-sub-bg
              hover:text-white
              hover:border-sub-bg
              transition-all
              cursor-pointer
              shadow-sm
            "
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* 카드 */}
          <div className="grid grid-cols-5 gap-6">
            {visibleRankingBooks.map((book, idx) => {
              const displayTitle = formatDisplayTitle(book.title || '')
              const rank = page * booksPerPage + idx + 1
              const rankClass = rank === 1
                ? 'bg-amber-500 text-white'
                : rank === 2
                  ? 'bg-slate-600 text-white'
                  : rank === 3
                    ? 'bg-amber-700 text-white'
                    : 'bg-sky-200 text-black'
              const isTopRank = rank <= 3
              const bookId = book?.bookId
              const showBookmark = !!currentUser && !!bookId
              const isBookmarked = showBookmark && bookmarkedIds.has(bookId)
              const isBookmarkLoading = showBookmark && bookmarkLoadingIds.has(bookId)

              return (
                <div
                  key={book.isbn13 || book.title || book.id}
                  className="relative flex flex-col items-center cursor-pointer overflow-visible hover:opacity-80 transition-opacity"
                  onClick={() => {
                    const keywordValue = book.isbn13 || displayTitle || book.title || ''
                    navigate(`/searchbook?keyword=${encodeURIComponent(keywordValue)}`)
                  }}
                >
                  <div
                    className={`absolute -left-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${rankClass} ${
                      isTopRank ? 'ring-2 ring-white shadow-[0_6px_12px_rgba(0,0,0,0.35)]' : ''
                    }`}
                  >
                    {rank}위
                    {isTopRank && (
                      <span
                        className={`absolute -right-1 -top-1 text-[14px] ${
                          rank === 1 ? 'text-amber-300' : rank === 2 ? 'text-slate-200' : 'text-amber-600'
                        }`}
                        aria-hidden="true"
                      >
                        ★
                      </span>
                    )}
                  </div>
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
                  {showBookmark && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleBookmark(bookId)
                      }}
                      disabled={isBookmarkLoading}
                      className={`absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer ${
                        isBookmarked
                          ? 'bg-yellow-400 text-white hover:bg-yellow-500'
                          : 'bg-white/90 text-gray-600 hover:text-yellow-600 border border-gray-200'
                      }`}
                      title={isBookmarked ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    >
                      {isBookmarked ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </button>
                  )}
                  <TwoLineTitle
                    text={displayTitle}
                    className="text-sm text-gray-700 text-center leading-snug"
                  />
                </div>
              )
            })}
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
              bg-white
              border
              border-gray-300
              flex
              items-center
              justify-center
              disabled:opacity-30
              hover:bg-sub-bg
              hover:text-white
              hover:border-sub-bg
              transition-all
              cursor-pointer
              shadow-sm
            "
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* ===============================
         서점별 베스트셀러 TOP10
      =============================== */}
      <section className="mb-12 border border-gray-200 bg-gray-50 p-8">
        <h2 className="text-2xl font-extrabold mb-6 text-sub-bg">
          서점 별 베스트셀러 TOP10
        </h2>

        {/* 서점 카테고리 */}
        <div className="flex gap-2 mb-8">
          {[
          { label: '교보문고', value: 'KYOBO', color: 'bg-emerald-600 hover:bg-emerald-700' },
          { label: '알라딘', value: 'ALADIN', color: 'bg-fuchsia-600 hover:bg-fuchsia-700' },
          { label: 'YES24', value: 'YES24', color: 'bg-blue-600 hover:bg-blue-700' }
        ].map(provider => {
          const isActive = provider.value === bestSellerProvider
          return (
            <button
              key={provider.value}
              onClick={() => { setBestPage(0); setBestSellerProvider(provider.value) }}
              className={`
                px-4
                py-2
                rounded
                text-sm
                font-medium
                transition-colors
                cursor-pointer
                ${isActive
                  ? `${provider.color} text-white`
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}
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
              bg-white
              border
              border-gray-300
              flex
              items-center
              justify-center
              disabled:opacity-30
              hover:bg-sub-bg
              hover:text-white
              hover:border-sub-bg
              transition-all
              cursor-pointer
              shadow-sm
            "
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="grid grid-cols-5 gap-6">
            {visibleBestSellerBooks.map((book, idx) => {
              const displayTitle = formatDisplayTitle(book.title || '')
              const rank = bestPage * bestBooksPerPage + idx + 1
              const rankClass = rank === 1
                ? 'bg-amber-500 text-white'
                : rank === 2
                  ? 'bg-slate-600 text-white'
                  : rank === 3
                    ? 'bg-amber-700 text-white'
                    : 'bg-sky-200 text-black'
              const isTopRank = rank <= 3
              const bookId = book?.bookId
              const showBookmark = !!currentUser && !!bookId
              const isBookmarked = showBookmark && bookmarkedIds.has(bookId)
              const isBookmarkLoading = showBookmark && bookmarkLoadingIds.has(bookId)

              return (
                <div
                  key={book.isbn13 || book.title || book.id}
                  className="relative flex flex-col items-center cursor-pointer overflow-visible hover:opacity-80 transition-opacity"
                  onClick={() => {
                    const keywordValue = book.isbn13 || displayTitle || book.title || ''
                    navigate(`/searchbook?keyword=${encodeURIComponent(keywordValue)}`)
                  }}
                >
                  <div
                    className={`absolute -left-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${rankClass} ${
                      isTopRank ? 'ring-2 ring-white shadow-[0_6px_12px_rgba(0,0,0,0.35)]' : ''
                    }`}
                  >
                    {rank}위
                    {isTopRank && (
                      <span
                        className={`absolute -right-1 -top-1 text-[14px] ${
                          rank === 1 ? 'text-amber-300' : rank === 2 ? 'text-slate-200' : 'text-amber-600'
                        }`}
                        aria-hidden="true"
                      >
                        ★
                      </span>
                    )}
                  </div>
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
                  {showBookmark && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleBookmark(bookId)
                      }}
                      disabled={isBookmarkLoading}
                      className={`absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer ${
                        isBookmarked
                          ? 'bg-yellow-400 text-white hover:bg-yellow-500'
                          : 'bg-white/90 text-gray-600 hover:text-yellow-600 border border-gray-200'
                      }`}
                      title={isBookmarked ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    >
                      {isBookmarked ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </button>
                  )}
                  <TwoLineTitle
                    text={displayTitle}
                    className="text-sm text-gray-700 text-center leading-snug"
                  />
                </div>
              )
            })}
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
              bg-white
              border
              border-gray-300
              flex
              items-center
              justify-center
              disabled:opacity-30
              hover:bg-sub-bg
              hover:text-white
              hover:border-sub-bg
              transition-all
              cursor-pointer
              shadow-sm
            "
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* ===============================
         커뮤니티 & 트렌드 (인기글 / 최신글)
      =============================== */}
      <section className="mb-12 border border-gray-200 bg-gray-50 p-8">
        <h2 className="text-2xl font-extrabold mb-5 text-sub-bg">
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
                className="text-sm text-gray-500 hover:underline cursor-pointer"
              >
                더보기
              </button>
            </div>

            <div className="relative h-[260px] overflow-hidden rounded-lg border border-gray-200 bg-white p-6">
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
                  const kindStyle = getCommunityKindStyle(post)

                  return (
                    <li key={post.communityId}>
                      <button
                        type="button"
                        onClick={() => handleCommunityClick(post.communityId)}
                        className="w-full text-left hover:underline line-clamp-1 cursor-pointer"
                      >
                        {isPopular && (
                          <span className="mr-1 inline-flex items-center rounded bg-rose-100 px-1.5 py-0.5 text-xs font-medium text-rose-700 cursor-pointer">
                            HOT
                          </span>
                        )}
                        <span className={`mr-1 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium cursor-pointer ${kindStyle}`}>
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

          {/* 트렌드 - 워드클라우드 */}
          <div className="col-span-12 lg:col-span-4">
            <h3 className="text-xl font-semibold mb-4">검색어 트렌드</h3>
            <div className="h-[260px] rounded-lg bg-white border border-gray-200 p-4 overflow-hidden">
              {trendLoading ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  로딩 중...
                </div>
              ) : keywordTrends.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-center">
                  검색 데이터를 수집 중입니다.<br />
                  <span className="text-sm">잠시 후 트렌드가 표시됩니다.</span>
                </div>
              ) : (
                <WordCloud
                  words={wordCloudItems}
                  onWordClick={(textValue) =>
                    navigate(`/searchbook?keyword=${encodeURIComponent(textValue)}`)
                  }
                />
              )}
            </div>
          </div>

          {/* 트렌드 도서 TOP3 */}
          <div className="col-span-12 lg:col-span-3">
            <h3 className="text-xl font-semibold mb-4">트렌드 도서 TOP 3</h3>
            <div className="h-[260px] rounded-lg bg-white border border-gray-200 p-4">
              {trendLoading ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  로딩 중...
                </div>
              ) : trendBooks.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-center text-sm">
                  관심 도서 데이터를<br />수집 중입니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {trendBooks.map((book, idx) => (
                    <div
                      key={book.bookId}
                      onClick={() => navigate(`/searchbook?keyword=${encodeURIComponent(book.text)}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          navigate(`/searchbook?keyword=${encodeURIComponent(book.text)}`)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="w-full flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left cursor-pointer"
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        idx === 0 ? 'bg-sub-bg' : idx === 1 ? 'bg-main-bg' : 'bg-main-bg'
                      }`}>
                        {idx + 1}
                      </span>
                      {book.imageUrl && (
                        <img
                          src={book.imageUrl}
                          alt={book.text}
                          className="w-10 h-14 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {book.text}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {book.author}
                        </p>
                      </div>
                      {currentUser && book.bookId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleBookmark(book.bookId)
                          }}
                          disabled={bookmarkLoadingIds.has(book.bookId)}
                          className={`ml-2 flex h-8 w-8 items-center justify-center rounded-full transition-all cursor-pointer ${
                            bookmarkedIds.has(book.bookId)
                              ? 'bg-yellow-400 text-white hover:bg-yellow-500'
                              : 'bg-white border border-gray-300 text-gray-500 hover:border-yellow-400 hover:text-yellow-600'
                          }`}
                          title={bookmarkedIds.has(book.bookId) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                        >
                          {bookmarkedIds.has(book.bookId) ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Alert 모달 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  )
}

export default MainPage
