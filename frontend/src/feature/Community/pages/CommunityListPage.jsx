import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useCommunities from '../hooks/useCommunities'
import useCommunityHelpers from '../hooks/useCommunityHelpers'
import { CommunityPostCard, SearchFilterBar, EmptyState } from '../components'
import { Pagination } from '@/shared/components'
import { Spinner } from '@/shared/components/icons'
import { getUserFromSession } from '@/shared/api/authApi'
import { toggleFollow, checkFollowing } from '@/shared/api/followApi'
import { deleteCommunity } from '../api/communityApi'

// 페이지당 게시글 수
const POSTS_PER_PAGE = 10

function CommunityListPage() {
  const { communities, loading, error, refetch } = useCommunities()
  const { formatDate, getPostTitle, stripHtml, getPreviewContent, getPostImages } = useCommunityHelpers()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('latest') // 'latest', 'popular'
  const [kindFilter, setKindFilter] = useState('ALL') // 'ALL', 'FREE', 'QUESTION', 'REVIEW'
  const [currentPage, setCurrentPage] = useState(1)

  // 현재 로그인한 사용자
  const currentUser = getUserFromSession()

  // URL에서 userId 파라미터 읽기 (특정 유저의 게시글 목록 보기)
  const filterUserId = searchParams.get('userId')
  const filterUserName = searchParams.get('userName')
  const isUserFilterMode = !!filterUserId

  // 팔로우 상태
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  // 팔로우 상태 확인 (유저 필터 모드일 때)
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!isUserFilterMode || !currentUser?.userId || !filterUserId) return
      // 자기 자신이면 체크 안함
      if (currentUser.userId === Number(filterUserId)) return
      
      try {
        const result = await checkFollowing(currentUser.userId, Number(filterUserId))
        setIsFollowing(result.isFollowing)
      } catch (error) {
        console.error('팔로우 상태 확인 실패:', error)
      }
    }
    checkFollowStatus()
  }, [isUserFilterMode, currentUser?.userId, filterUserId])

  // 팔로우/언팔로우 토글
  const handleToggleFollow = async () => {
    if (!currentUser?.userId || !filterUserId) return
    
    setFollowLoading(true)
    try {
      const result = await toggleFollow(currentUser.userId, Number(filterUserId))
      if (result.success) {
        setIsFollowing(result.isFollowing)
      }
    } catch (error) {
      console.error('팔로우 토글 실패:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  // 공지글과 일반글 분리 (공지글은 최신 3개만)
  const { noticePosts, regularPosts } = useMemo(() => {
    const notices = communities
      .filter(post => post.isNotice === 1)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)  // 최신 3개만
    const regulars = communities.filter(post => post.isNotice !== 1)
    return { noticePosts: notices, regularPosts: regulars }
  }, [communities])

  // 검색 및 정렬 적용 (일반글만)
  const filteredCommunities = useMemo(() => {
    let result = [...regularPosts]

    // 특정 유저의 게시글만 필터링
    if (filterUserId) {
      result = result.filter(post => post.userId === Number(filterUserId))
    }

    // 게시글 종류 필터
    if (kindFilter !== 'ALL') {
      result = result.filter(post => post.communityKind === kindFilter)
    }

    // 검색 필터
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(post => {
        let title = ''
        let content = ''
        try {
          const parsed = JSON.parse(post.contentJson || '{}')
          title = parsed.title || ''
          content = parsed.content || ''
        } catch {
          content = post.contentJson || ''
        }
        
        return (
          title.toLowerCase().includes(term) ||
          content.toLowerCase().includes(term) ||
          (post.bookTitle || '').toLowerCase().includes(term) ||
          (post.authorNickname || '').toLowerCase().includes(term)
        )
      })
    }

    // 정렬
    if (sortBy === 'popular') {
      result.sort((a, b) => (b.communityGreat || 0) - (a.communityGreat || 0))
    } else {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    return result
  }, [regularPosts, searchTerm, sortBy, kindFilter, filterUserId])

  // 전체 페이지 수 계산
  const totalPages = Math.ceil(filteredCommunities.length / POSTS_PER_PAGE)

  // 현재 페이지에 해당하는 게시글만 추출
  const currentPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE
    const endIndex = startIndex + POSTS_PER_PAGE
    return filteredCommunities.slice(startIndex, endIndex)
  }, [filteredCommunities, currentPage])

  // 검색어나 정렬 변경 시 첫 페이지로 이동
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleSortChange = (sort) => {
    setSortBy(sort)
    setCurrentPage(1)
  }

  const handleKindChange = (kind) => {
    setKindFilter(kind)
    setCurrentPage(1)
  }

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 게시글 상세 페이지로 이동
  const handlePostClick = (postId) => {
    navigate(`/community/${postId}`)
  }

  // 작성자 클릭 시 해당 유저의 게시글 목록으로 이동
  const handleAuthorClick = (userId, userName) => {
    // 내 프로필이면 마이페이지로 이동
    if (currentUser && currentUser.userId === userId) {
      navigate('/mypage/posts')
    } else {
      navigate(`/community?userId=${userId}&userName=${encodeURIComponent(userName || '사용자')}`)
    }
  }

  // 유저 필터 해제
  const handleClearUserFilter = () => {
    navigate('/community')
  }

  // 게시글 삭제
  const handleDeletePost = async (communityId) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      const result = await deleteCommunity(communityId, currentUser.userId)
      if (result.success) {
        alert('게시글이 삭제되었습니다.')
        refetch() // 목록 새로고침
      } else {
        alert(result.message || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-10 h-10 text-main-bg" />
          <p className="text-gray-400 text-sm">커뮤니티 글을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-400 text-sm">잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          {isUserFilterMode ? (
            <>
              <h1 className="text-2xl font-extrabold text-sub-bg mb-2">
                {decodeURIComponent(filterUserName || '사용자')}님의 게시글
              </h1>
              {/* 팔로우 버튼 (로그인 상태이고 자기 자신이 아닐 때만 표시) */}
              {currentUser && currentUser.userId !== Number(filterUserId) && (
                <button
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`mt-2 px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                    isFollowing
                      ? 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                      : 'bg-main-bg text-white hover:bg-sub-bg'
                  } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {followLoading ? '처리 중...' : (isFollowing ? '언팔로우' : '팔로우')}
                </button>
              )}
              <button
                onClick={handleClearUserFilter}
                className="block mx-auto mt-3 text-gray-400 text-sm hover:text-main-bg transition-colors cursor-pointer"
              >
                ← 전체 커뮤니티글 보기
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-sub-bg mb-2">커뮤니티</h1>
              <p className="text-gray-400 text-sm">독서 경험을 나누고, 다른 독자들의 이야기를 만나보세요.</p>
            </>
          )}
        </div>

        {/* 검색 및 필터 (유저 필터 모드에서도 표시) */}
        <SearchFilterBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          kindFilter={kindFilter}
          onKindChange={handleKindChange}
        />

        {/* 통계 및 글쓰기 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-400 text-sm">
            총 <span className="font-bold text-sub-bg">{filteredCommunities.length}</span>개의 게시글
          </p>
          {!isUserFilterMode && (
            <button
              onClick={() => navigate('/community/write')}
              className="flex items-center gap-2 px-4 py-2 bg-main-bg text-white text-sm font-medium
                       hover:bg-sub-bg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              글쓰기
            </button>
          )}
        </div>

        {/* 공지글 (전체 목록일 때만 상단에 표시) */}
        {!isUserFilterMode && noticePosts.length > 0 && (
          <div className="mb-4 space-y-2">
            {noticePosts.map((post) => (
              <article
                key={post.communityId}
                onClick={() => handlePostClick(post.communityId)}
                className="bg-amber-50 border border-amber-200 p-4 
                         hover:border-amber-400 hover:shadow-sm cursor-pointer
                         transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 px-2 py-1 bg-amber-500 text-white text-xs font-bold">
                    공지
                  </span>
                  <h2 className="text-sm font-bold text-gray-800 truncate flex-1">
                    {getPostTitle(post)}
                  </h2>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* 게시글 목록 */}
        {filteredCommunities.length === 0 && noticePosts.length === 0 ? (
          <EmptyState
            title={searchTerm ? '검색 결과가 없습니다' : '아직 게시글이 없습니다'}
            description={searchTerm ? '다른 키워드로 검색해보세요.' : '첫 번째 글을 작성해보세요!'}
          />
        ) : filteredCommunities.length === 0 ? (
          <EmptyState
            title={searchTerm ? '검색 결과가 없습니다' : '일반 게시글이 없습니다'}
            variant="minimal"
          />
        ) : (
          <>
            {/* 그리드 레이아웃 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPosts.map((post) => (
                <div key={post.communityId}>
                  <CommunityPostCard
                    post={post}
                    onClick={handlePostClick}
                    formatDate={formatDate}
                    getPostTitle={getPostTitle}
                    getPreviewContent={getPreviewContent}
                    getPostImages={getPostImages}
                    currentUserId={currentUser?.userId}
                    onDelete={handleDeletePost}
                    onAuthorClick={handleAuthorClick}
                  />
                </div>
              ))}
            </div>

            {/* 페이징 */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default CommunityListPage
