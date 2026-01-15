import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCommunities } from '@/feature/Community/api/communityApi'
import { deletePostByAdmin } from '../api/adminCommunityApi'
import { AlertModal, ConfirmModal } from '@/shared/components'
import { useModals } from '@/shared/hooks'
import SearchFilterBar from '@/feature/Community/components/SearchFilterBar'
import Pagination from '@/shared/components/navigation/Pagination'

const ITEMS_PER_PAGE = 10

function PostManagePage() {
  const navigate = useNavigate()
  
  // 상태
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
  // 필터/검색 상태
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [kindFilter, setKindFilter] = useState('ALL')

  // Alert/Confirm 모달 훅
  const { alertModal, showAlert, closeAlert, confirmModal, showConfirm, closeConfirm } = useModals()

  // 게시글 목록 조회
  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchCommunities()
      setPosts(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load posts:', e)
      showAlert('로딩 실패', '게시글 목록을 불러오는데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  // 게시글 제목 추출
  const getPostTitle = (post) => {
    try {
      if (post.contentJson) {
        const parsed = JSON.parse(post.contentJson)
        return parsed.title || '(제목 없음)'
      }
    } catch {
      // ignore
    }
    return '(제목 없음)'
  }

  // 필터링 및 정렬
  const filteredPosts = useMemo(() => {
    let result = [...posts]

    // 종류 필터
    if (kindFilter === 'NOTICE') {
      result = result.filter(post => Number(post.isNotice) === 1)
    } else if (kindFilter !== 'ALL') {
      result = result.filter(post => post.communityKind === kindFilter && Number(post.isNotice) !== 1)
    }

    // 검색어 필터
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(post => {
        const title = getPostTitle(post).toLowerCase()
        const nickname = (post.authorNickname || '').toLowerCase()
        return title.includes(term) || nickname.includes(term)
      })
    }

    // 정렬
    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    } else {
      result.sort((a, b) => (b.communityGreat || 0) - (a.communityGreat || 0))
    }

    return result
  }, [posts, kindFilter, searchTerm, sortBy])

  // 페이지네이션
  const totalPages = useMemo(() => Math.ceil(filteredPosts.length / ITEMS_PER_PAGE), [filteredPosts.length])
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredPosts.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredPosts, currentPage])

  // 핸들러
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

  const handleView = (communityId) => {
    navigate(`/community/${communityId}`)
  }

  const handleDelete = (post) => {
    const title = getPostTitle(post)
    showConfirm(
      '게시글 삭제',
      `"${title}" 게시글을 삭제하시겠습니까?`,
      async () => {
        try {
          await deletePostByAdmin(post.communityId)
          showAlert('삭제 완료', '게시글이 삭제되었습니다.', 'success')
          loadPosts()
        } catch (e) {
          console.error('Failed to delete post:', e)
          showAlert('삭제 실패', '삭제에 실패했습니다.', 'error')
        }
        closeConfirm()
      },
      'danger'
    )
  }

  // 종류 라벨
  const getKindLabel = (post) => {
    if (Number(post.isNotice) === 1) return '공지'
    switch (post.communityKind) {
      case 'REVIEW': return '리뷰'
      case 'QUESTION': return '질문'
      case 'FREE':
      default: return '자유'
    }
  }

  const getKindStyle = (post) => {
    if (Number(post.isNotice) === 1) return 'bg-orange-100 text-orange-700'
    switch (post.communityKind) {
      case 'REVIEW': return 'bg-green-100 text-green-700'
      case 'QUESTION': return 'bg-purple-100 text-purple-700'
      case 'FREE':
      default: return 'bg-blue-100 text-blue-700'
    }
  }

  // 날짜 포맷
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">커뮤니티 게시글 관리</h2>
      </div>

      {/* 검색/필터 */}
      <SearchFilterBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        kindFilter={kindFilter}
        onKindChange={handleKindChange}
      />

      {/* 통계 */}
      <div className="mb-4 text-sm text-gray-600">
        총 {filteredPosts.length}개의 게시글
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-10 text-center text-gray-500">로딩 중...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            {posts.length === 0 ? '등록된 게시글이 없습니다.' : '검색 결과가 없습니다.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-4 py-3 text-center font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">제목</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">작성자</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">종류</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">좋아요</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">작성일</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPosts.map((post) => (
                <tr key={post.communityId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-center">{post.communityId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <span className="line-clamp-1">{getPostTitle(post)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-center">{post.authorNickname || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs rounded ${getKindStyle(post)}`}>
                      {getKindLabel(post)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-center">{post.communityGreat || 0}</td>
                  <td className="px-4 py-3 text-gray-500 text-center whitespace-nowrap">
                    {formatDate(post.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button 
                      onClick={() => handleView(post.communityId)}
                      className="text-blue-600 hover:underline mr-3 cursor-pointer"
                    >
                      보기
                    </button>
                    <button 
                      onClick={() => handleDelete(post)}
                      className="text-red-600 hover:underline cursor-pointer"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {!loading && filteredPosts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Alert 모달 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Confirm 모달 */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onCancel={closeConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        confirmText="삭제"
        cancelText="취소"
        type={confirmModal.type}
      />
    </div>
  )
}

export default PostManagePage
