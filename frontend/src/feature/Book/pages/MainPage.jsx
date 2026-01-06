import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function MainPage() {
  const moodKeywords = [
    { label: '비 오는 날 읽기 좋은', keyword: '비 오는 날 소설' },
    { label: '마음이 복잡할 때', keyword: '힐링 에세이' },
    { label: '짧게 읽기 좋은', keyword: '단편 소설' },
    { label: '가볍게 웃고 싶을 때', keyword: '유머 에세이' },
  ]

  /* ===============================
     🔍 검색
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
     📊 서울시 월간 대출랭킹
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

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* ===============================
         🌦 상황별 추천 검색
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
         🔍 메인 검색 바
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
            placeholder="도서명, 저자, ISBN으로 검색하세요"
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
            🔍
          </button>
        </form>
      </div>

      {/* ===============================
         📊 서울시 월간 대출랭킹
      =============================== */}
      <section className="mb-32">

        <h2 className="text-3xl font-bold mb-6 text-gray-900">
          서울 내 도서관 월간 대출랭킹
        </h2>

        {/* 카테고리 */}
        <div className="flex gap-3 mb-8">
          {['아동', '청소년', '성인'].map(label => (
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
            ◀
          </button>

          {/* 카드 */}
          <div className="grid grid-cols-5 gap-6">
            {visibleRankingBooks.map(book => (
              <div
                key={book.id}
                className="flex flex-col items-center cursor-pointer"
                onClick={() =>
                  navigate(`/searchbook?keyword=${encodeURIComponent(book.title)}`)
                }
              >
                {/* 빈 이미지 */}
                <div className="w-full aspect-[3/4] bg-gray-300 rounded-lg mb-3" />

                {/* 제목 */}
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
            ▶
          </button>

        </div>
      </section>
            {/* ===============================
               🧩 하단 정보 영역 (커뮤니티 / 키워드)
            =============================== */}
            <section className="mb-32">

              {/* 섹션 타이틀 */}
              <h2 className="text-3xl font-bold mb-10 text-gray-900">
                커뮤니티 & 트렌드
              </h2>

              <div className="grid grid-cols-12 gap-8">

                {/* ===============================
                   🗂 커뮤니티 글 리스트
                =============================== */}
                <div className="col-span-12 lg:col-span-5">

                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-semibold">커뮤니티</h3>
                    <button
                      className="
                        text-sm
                        text-gray-500
                        hover:underline
                      "
                    >
                      더보기
                    </button>
                  </div>

                  {/* 빈 박스 */}
                  <div className="h-[260px] rounded-2xl bg-gray-200 p-6">
                    <ul className="space-y-3 text-gray-500 text-sm">
                      <li>인기 게시글 1</li>
                      <li>인기 게시글 2</li>
                      <li>인기 게시글 3</li>
                      <li>글목록</li>
                      <li>글목록</li>
                      <li>글목록</li>
                    </ul>
                  </div>
                </div>

                {/* ===============================
                   ☁ 키워드 클라우드
                =============================== */}
                <div className="col-span-12 lg:col-span-4">

                  <h3 className="text-xl font-semibold mb-4">
                    키워드 트렌드
                  </h3>

                  {/* 빈 박스 */}
                  <div className="h-[260px] rounded-2xl bg-gray-200 flex items-center justify-center text-gray-500">
                    키워드 워드클라우드
                  </div>
                </div>

                {/* ===============================
                   🔥 키워드 검색량 기반 인기책 TOP3
                =============================== */}
                <div className="col-span-12 lg:col-span-3">

                  <h3 className="text-xl font-semibold mb-4">
                    인기 책 TOP 3
                  </h3>

                  {/* 빈 박스 */}
                  <div className="h-[260px] rounded-2xl bg-gray-200 flex items-center justify-center text-gray-700 text-center px-6">
                    키워드 검색량에 따른<br />
                    인기 책 TOP 3
                  </div>
                </div>

              </div>
            </section>

    </div>
  )
}

export default MainPage
