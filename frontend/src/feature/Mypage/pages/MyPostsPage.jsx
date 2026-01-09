import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCommunities } from '@/feature/Community/api/communityApi'
import useCommunityHelpers from '@/feature/Community/hooks/useCommunityHelpers'
import { SearchFilterBar } from '@/feature/Community/components'
import { getUserFromSession } from '@/shared/api/authApi'
import { Spinner } from '@/shared/components/icons'

function MyPostsPage() {
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const { formatDate, getPostTitle, getKindLabel, getKindStyle } = useCommunityHelpers()
  const navigate = useNavigate()

  // 커뮤니티 목록 조회
  useEffect(() => {
    fetchCommunities()
      .then(data => {
        setCommunities(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('커뮤니티 목록 로딩 실패:', err)
        setLoading(false)
      })
  }, [])
  
  // 필터/검색/정렬 상태
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [kindFilter, setKindFilter] = useState('ALL')

  // 현재 로그인한 사용자
  const currentUser = getUserFromSession()

  // 내 게시글만 필터링 + 검색 + 정렬
  const filteredPosts = useMemo(() => {
    if (!currentUser) return []
    
    let result = communities.filter(post => post.userId === currentUser.userId)

    // 종류 필터
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
          (post.bookTitle || '').toLowerCase().includes(term)
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
  }, [communities, currentUser, kindFilter, searchTerm, sortBy])

  // 전체 내 게시글 (통계용)
  const myPosts = useMemo(() => {
    if (!currentUser) return []
    return communities.filter(post => post.userId === currentUser.userId)
  }, [communities, currentUser])

  // 통계 계산
  const totalLikes = myPosts.reduce((acc, p) => acc + (p.communityGreat || 0), 0)
  const totalComments = myPosts.reduce((acc, p) => acc + (p.commentCount || 0), 0)

  const getKindBadge = (kind) => {
    return (
      <span className={`px-2 py-0.5 text-xs font-medium ${getKindStyle(kind)}`}>
        {getKindLabel(kind)}
      </span>
    )
  }

  // 검색/정렬 핸들러
  const handleSearchChange = (e) => setSearchTerm(e.target.value)
  const handleSortChange = (sort) => setSortBy(sort)
  const handleKindChange = (kind) => setKindFilter(kind)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-main-bg" />
      </div>
    )
  }

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">내 게시글</h2>
        <p className="text-gray-400 text-sm mt-1">내가 작성한 게시글을 확인하고 관리할 수 있습니다.</p>
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

      {/* 통계 */}
      <div className="flex gap-4 mb-6 text-sm text-gray-500">
        <span>총 게시글 <strong className="text-gray-800">{myPosts.length}</strong>개</span>
        <span>받은 좋아요 <strong className="text-gray-800">{totalLikes}</strong>개</span>
        <span>받은 댓글 <strong className="text-gray-800">{totalComments}</strong>개</span>
      </div>

      {/* 게시글 목록 */}
      <div className="border border-gray-200 shadow-sm">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {searchTerm ? '검색 결과가 없습니다.' : kindFilter !== 'ALL' ? '해당 카테고리의 게시글이 없습니다.' : '작성한 게시글이 없습니다.'}
          </div>
        ) : (
          filteredPosts.map((post, index) => (
            <div
              key={post.communityId}
              onClick={() => navigate(`/community/${post.communityId}`)}
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                index !== filteredPosts.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  {getKindBadge(post.communityKind)}
                  <h3 className="text-sm font-medium text-gray-800 truncate group-hover:text-main-bg transition-colors">
                    {getPostTitle(post)}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs flex-shrink-0">
                  <span>좋아요 {post.communityGreat || 0}</span>
                  <span>댓글 {post.commentCount || 0}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400 text-right">
                {formatDate(post.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MyPostsPage
