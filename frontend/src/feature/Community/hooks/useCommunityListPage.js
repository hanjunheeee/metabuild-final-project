import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useCommunityHelpers from './useCommunityHelpers'
import { getUserFromSession } from '@/shared/api/authApi'
import { toggleFollow, checkFollowing } from '@/shared/api/followApi'
import { fetchCommunities, deleteCommunity, fetchHotPosts } from '../api/communityApi'
import { fetchBookmarkedBookIds, toggleBookmark } from '@/shared/api/bookmarkApi'

// 페이지당 게시글 수
const POSTS_PER_PAGE = 10

/**
 * CommunityListPage 전용 훅
 * 상태 관리, 필터링, HOT 게시글, 팔로우 등 모든 로직 포함
 */
function useCommunityListPage() {
  // === 커뮤니티 목록 fetch (기존 useCommunities 인라인) ===
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadCommunities = useCallback(() => {
    setLoading(true)
    fetchCommunities()
      .then(data => {
        setCommunities(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error:', err)
        setError(err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadCommunities()
  }, [loadCommunities])

  const refetch = useCallback(() => {
    loadCommunities()
  }, [loadCommunities])

  // === 기존 로직 ===
  const helpers = useCommunityHelpers()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // 필터/정렬/페이지 상태
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [kindFilter, setKindFilter] = useState('ALL')
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

  // HOT 게시글
  const [hotPosts, setHotPosts] = useState([])
  const [hotPostIds, setHotPostIds] = useState(new Set())

  // 북마크한 책 ID 목록
  const [bookmarkedBookIds, setBookmarkedBookIds] = useState(new Set())

  // 팔로우 상태 확인 (유저 필터 모드일 때)
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!isUserFilterMode || !currentUser?.userId || !filterUserId) return
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

  // HOT 게시글 가져오기
  useEffect(() => {
    const loadHotPosts = async () => {
      try {
        const data = await fetchHotPosts(4)
        setHotPosts(data)
        setHotPostIds(new Set(data.map(post => post.communityId)))
      } catch (error) {
        console.error('HOT 게시글 로딩 실패:', error)
      }
    }
    loadHotPosts()
  }, [])

  // 북마크한 책 ID 목록 가져오기
  useEffect(() => {
    const loadBookmarkedBookIds = async () => {
      if (!currentUser?.userId) return
      try {
        const bookIds = await fetchBookmarkedBookIds(currentUser.userId)
        setBookmarkedBookIds(new Set(bookIds))
      } catch (error) {
        console.error('북마크 목록 로딩 실패:', error)
      }
    }
    loadBookmarkedBookIds()
  }, [currentUser?.userId])

  // 공지글과 일반글 분리 (공지글은 최신 3개만)
  const { noticePosts, regularPosts } = useMemo(() => {
    const notices = communities
      .filter(post => post.isNotice === 1)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
    const regulars = communities.filter(post => post.isNotice !== 1)
    return { noticePosts: notices, regularPosts: regulars }
  }, [communities])

  // 검색 및 정렬 적용
  const filteredCommunities = useMemo(() => {
    let result = kindFilter === 'NOTICE' 
      ? communities.filter(post => post.isNotice === 1)
      : [...regularPosts]

    if (filterUserId && kindFilter !== 'NOTICE') {
      result = result.filter(post => post.userId === Number(filterUserId))
    }

    if (kindFilter !== 'ALL' && kindFilter !== 'NOTICE') {
      result = result.filter(post => post.communityKind === kindFilter)
    }

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

    if (sortBy === 'popular') {
      result.sort((a, b) => (b.communityGreat || 0) - (a.communityGreat || 0))
    } else {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    return result
  }, [communities, regularPosts, searchTerm, sortBy, kindFilter, filterUserId])

  // 전체 페이지 수 계산
  const totalPages = Math.ceil(filteredCommunities.length / POSTS_PER_PAGE)

  // 현재 페이지에 해당하는 게시글만 추출
  const currentPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE
    const endIndex = startIndex + POSTS_PER_PAGE
    return filteredCommunities.slice(startIndex, endIndex)
  }, [filteredCommunities, currentPage])

  // === 핸들러 함수들 ===

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

  // 검색어 변경
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  // 정렬 변경
  const handleSortChange = (sort) => {
    setSortBy(sort)
    setCurrentPage(1)
  }

  // 게시글 종류 필터 변경
  const handleKindChange = (kind) => {
    setKindFilter(kind)
    setCurrentPage(1)
  }

  // 페이지 변경
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
        refetch()
      } else {
        alert(result.message || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  // 글쓰기 페이지로 이동
  const handleWriteClick = () => {
    navigate('/community/write')
  }

  // 북마크 토글
  const handleBookmark = async (bookId) => {
    if (!currentUser?.userId) {
      alert('로그인이 필요합니다.')
      navigate('/login')
      return
    }

    try {
      const result = await toggleBookmark(currentUser.userId, bookId)
      if (result.success) {
        setBookmarkedBookIds(prev => {
          const newSet = new Set(prev)
          if (result.bookmarked) {
            newSet.add(bookId)
          } else {
            newSet.delete(bookId)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('북마크 토글 실패:', error)
    }
  }

  return {
    // 상태
    loading,
    error,
    currentUser,
    searchTerm,
    sortBy,
    kindFilter,
    currentPage,
    totalPages,
    isFollowing,
    followLoading,
    hotPosts,
    hotPostIds,
    bookmarkedBookIds,
    
    // 필터 모드
    filterUserId,
    filterUserName,
    isUserFilterMode,
    
    // 데이터
    noticePosts,
    filteredCommunities,
    currentPosts,
    
    // 핸들러
    handleToggleFollow,
    handleSearchChange,
    handleSortChange,
    handleKindChange,
    handlePageChange,
    handlePostClick,
    handleAuthorClick,
    handleClearUserFilter,
    handleDeletePost,
    handleWriteClick,
    handleBookmark,
    
    // 헬퍼 함수 (useCommunityHelpers에서 가져온 것들)
    ...helpers,
  }
}

export default useCommunityListPage

