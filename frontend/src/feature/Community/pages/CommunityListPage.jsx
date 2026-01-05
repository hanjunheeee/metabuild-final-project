import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useCommunities from '../hooks/useCommunities'
import { CommunityPostCard, SearchFilterBar, EmptyState } from '../components'
import { Pagination } from '@/shared/components'
import { Spinner } from '@/shared/components/icons'
import { getUserFromSession } from '@/shared/api/authApi'
import { deleteCommunity } from '../api/communityApi'

// 페이지당 게시글 수
const POSTS_PER_PAGE = 10

function CommunityListPage() {
  const { communities, loading, error, refetch } = useCommunities()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('latest') // 'latest', 'popular'
  const [kindFilter, setKindFilter] = useState('ALL') // 'ALL', 'FREE', 'QUESTION', 'REVIEW'
  const [currentPage, setCurrentPage] = useState(1)

  // 현재 로그인한 사용자
  const currentUser = getUserFromSession()

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
  }, [regularPosts, searchTerm, sortBy, kindFilter])

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

  // 날짜 포맷
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '오늘'
    if (days === 1) return '어제'
    if (days < 7) return `${days}일 전`
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // 게시글 제목 추출
  const getPostTitle = (post) => {
    try {
      const parsed = JSON.parse(post.contentJson || '{}')
      return parsed.title || '제목 없음'
    } catch {
      return post.contentJson?.substring(0, 50) || '제목 없음'
    }
  }

  // HTML 태그 제거 함수
  const stripHtml = (html) => {
    if (!html) return ''
    // HTML 태그 제거
    const text = html.replace(/<[^>]*>/g, '')
    // HTML 엔티티 디코딩 (&nbsp;, &amp; 등)
    const decoded = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
    // 연속 공백 제거
    return decoded.replace(/\s+/g, ' ').trim()
  }

  // 게시글 미리보기 내용 추출
  const getPreviewContent = (post) => {
    try {
      const parsed = JSON.parse(post.contentJson || '{}')
      const content = stripHtml(parsed.content || '')
      return content.length > 120 ? content.substring(0, 120) + '...' : content
    } catch {
      const content = stripHtml(post.contentJson || '')
      return content.length > 120 ? content.substring(0, 120) + '...' : content
    }
  }

  // 게시글 내 이미지 추출
  const getPostImages = (post) => {
    try {
      const parsed = JSON.parse(post.contentJson || '{}')
      const content = parsed.content || ''
      // img 태그에서 src 추출
      const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/g
      const images = []
      let match
      while ((match = imgPattern.exec(content)) !== null) {
        images.push(match[1])
      }
      return images
    } catch {
      return []
    }
  }

  // 게시글 상세 페이지로 이동
  const handlePostClick = (postId) => {
    navigate(`/community/${postId}`)
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
          <h1 className="text-2xl font-extrabold text-sub-bg mb-2">커뮤니티</h1>
          <p className="text-gray-400 text-sm">독서 경험을 나누고, 다른 독자들의 이야기를 만나보세요.</p>
        </div>

        {/* 검색 및 필터 */}
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
          <button
            onClick={() => navigate('/community/write')}
            className="flex items-center gap-2 px-4 py-2 bg-main-bg text-white text-sm font-medium
                     hover:bg-sub-bg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            글쓰기
          </button>
        </div>

        {/* 공지글 (항상 상단에 표시) */}
        {noticePosts.length > 0 && (
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
            {/* 인스타그램 스타일 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPosts.map((post) => {
                const images = getPostImages(post)
                const hasImages = images.length > 0
                return (
                  <div 
                    key={post.communityId}
                    className={hasImages ? 'md:col-span-2' : ''}
                  >
                    <CommunityPostCard
                      post={post}
                      onClick={handlePostClick}
                      formatDate={formatDate}
                      getPostTitle={getPostTitle}
                      getPreviewContent={getPreviewContent}
                      getPostImages={getPostImages}
                      currentUserId={currentUser?.userId}
                      onDelete={handleDeletePost}
                    />
                  </div>
                )
              })}
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
