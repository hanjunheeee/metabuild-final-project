import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCommunities, fetchLikedCommunityIds, likeCommunity } from '@/feature/Community/api/communityApi'
import useCommunityHelpers from '@/feature/Community/hooks/useCommunityHelpers'
import { SearchFilterBar } from '@/feature/Community/components'
import { getUserFromSession } from '@/shared/api/authApi'
import { Spinner } from '@/shared/components/icons'

function MyLikesPage() {
  const [communities, setCommunities] = useState([])
  const [communitiesLoading, setCommunitiesLoading] = useState(true)
  const [likedIds, setLikedIds] = useState([])
  const [idsLoading, setIdsLoading] = useState(true)
  const { formatDate, getPostTitle, getKindLabel, getKindStyle } = useCommunityHelpers()
  const navigate = useNavigate()
  const currentUser = getUserFromSession()

  // 필터/검색/정렬 상태
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [kindFilter, setKindFilter] = useState('ALL')

  // 커뮤니티 목록 조회
  useEffect(() => {
    fetchCommunities()
      .then(data => {
        setCommunities(data)
        setCommunitiesLoading(false)
      })
      .catch(err => {
        console.error('커뮤니티 목록 로딩 실패:', err)
        setCommunitiesLoading(false)
      })
  }, [])

  // 좋아요한 게시글 ID 목록 조회
  useEffect(() => {
    const loadLikedIds = async () => {
      if (!currentUser?.userId) return
      try {
        setIdsLoading(true)
        const ids = await fetchLikedCommunityIds(currentUser.userId)
        setLikedIds(ids)
      } catch (error) {
        console.error('좋아요한 게시글 ID 조회 실패:', error)
      } finally {
        setIdsLoading(false)
      }
    }
    loadLikedIds()
  }, [currentUser?.userId])

  // 좋아요한 게시글만 필터링 (통계용)
  const likedPosts = useMemo(() => {
    if (!likedIds.length) return []
    return communities.filter(post => likedIds.includes(post.communityId))
  }, [communities, likedIds])

  // 검색/필터/정렬 적용
  const filteredPosts = useMemo(() => {
    let result = [...likedPosts]

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
  }, [likedPosts, kindFilter, searchTerm, sortBy])

  // 좋아요 취소
  const handleUnlike = async (e, communityId) => {
    e.stopPropagation()
    if (!currentUser) return

    try {
      const result = await likeCommunity(communityId, currentUser.userId)
      if (result.success && !result.liked) {
        // ID 목록에서 제거
        setLikedIds(prev => prev.filter(id => id !== communityId))
      }
    } catch (error) {
      console.error('좋아요 취소 실패:', error)
    }
  }

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

  const loading = communitiesLoading || idsLoading

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
        <h2 className="text-lg font-bold text-gray-800">좋아요한 글</h2>
        <p className="text-gray-400 text-sm mt-1">내가 좋아요를 누른 게시글을 확인할 수 있습니다.</p>
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
      <div className="mb-6 text-sm text-gray-500">
        총 <strong className="text-gray-800">{likedPosts.length}</strong>개의 글에 좋아요
      </div>

      {/* 게시글 목록 */}
      <div className="border border-gray-200 shadow-sm">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {searchTerm ? '검색 결과가 없습니다.' : kindFilter !== 'ALL' ? '해당 카테고리의 좋아요한 게시글이 없습니다.' : '좋아요한 게시글이 없습니다.'}
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
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-gray-800 truncate group-hover:text-main-bg transition-colors">
                      {getPostTitle(post)}
                    </h3>
                    <p className="text-xs text-gray-400">by {post.authorNickname || '익명'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs flex-shrink-0">
                  <span>좋아요 {post.communityGreat || 0}</span>
                  <span>댓글 {post.commentCount || 0}</span>
                  <button 
                    onClick={(e) => handleUnlike(e, post.communityId)}
                    className="px-2 py-1 text-xs text-red-500 border border-red-300 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    취소
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-400 pl-0.5 text-right">
                {formatDate(post.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MyLikesPage
