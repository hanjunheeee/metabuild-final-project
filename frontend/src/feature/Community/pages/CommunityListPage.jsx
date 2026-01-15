import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import useCommunityListPage from '../hooks/useCommunityListPage'
import { CommunityPostCard, CommunityPostList, SearchFilterBar, EmptyState } from '../components'
import { Pagination } from '@/shared/components'
import { Spinner } from '@/shared/components/icons'
import { checkFollowing, toggleFollow } from '@/shared/api/followApi'
import { isAdmin } from '@/shared/utils/userDisplay'

function CommunityListPage() {
  const navigate = useNavigate()
  const [selectedAuthor, setSelectedAuthor] = useState(null)
  const [selectedAuthorPostId, setSelectedAuthorPostId] = useState(null)
  const [authorFollowing, setAuthorFollowing] = useState(false)
  const [authorFollowLoading, setAuthorFollowLoading] = useState(false)
  const {
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
    likedCommunityIds,
    userTitles,

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

    // 헬퍼 함수
    formatDate,
    getPostTitle,
    getPreviewContent,
    getPostImages,
    getBadgeConfig,
  } = useCommunityListPage()

  const openAuthorPanel = async (postId, userId, userName, userPhoto, userRole) => {
    const author = { userId, nickname: userName, userPhoto, role: userRole }
    setSelectedAuthor(author)
    setSelectedAuthorPostId(postId)

    if (!currentUser?.userId || currentUser.userId === userId || isAdmin(author)) {
      setAuthorFollowing(false)
      return
    }

    try {
      const result = await checkFollowing(currentUser.userId, userId)
      setAuthorFollowing(!!result?.isFollowing)
    } catch (error) {
      console.error('??? ?? ?? ??:', error)
      setAuthorFollowing(false)
    }
  }

  const closeAuthorPanel = () => {
    setSelectedAuthor(null)
    setSelectedAuthorPostId(null)
  }

  const handleAuthorFollowToggle = async () => {
    if (!selectedAuthor) return
    if (!currentUser?.userId) {
      alert('???? ?????.')
      navigate('/login')
      return
    }
    if (currentUser.userId === selectedAuthor.userId) return

    setAuthorFollowLoading(true)
    try {
      const result = await toggleFollow(currentUser.userId, selectedAuthor.userId)
      if (result.success) {
        setAuthorFollowing(result.isFollowing)
      }
    } catch (error) {
      console.error('??? ?? ??:', error)
    } finally {
      setAuthorFollowLoading(false)
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
        <div className="mb-8">
          {isUserFilterMode ? (
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-sub-bg mb-2">
                {decodeURIComponent(filterUserName || '사용자')}의 게시글
              </h1>
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
                  {followLoading ? '처리 중...' : (isFollowing ? '팔로잉' : '팔로우')}
                </button>
              )}
              <button
                onClick={handleClearUserFilter}
                className="block mx-auto mt-3 text-gray-400 text-sm hover:text-main-bg transition-colors cursor-pointer"
              >
                전체 커뮤니티글 보기
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="text-center">
                <h1 className="text-2xl font-extrabold text-sub-bg mb-2">커뮤니티</h1>
                <p className="text-gray-400 text-sm">독서 경험을 나누고, 다른 독자들의 이야기를 만나보세요.</p>
              </div>
              <button
                onClick={() => navigate('/community/rank')}
                className="absolute right-0 bottom-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 
                         text-white text-sm font-medium hover:from-amber-600 hover:to-orange-600 
                         transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="text-sm">🏆</span>
                명예의전당
              </button>
            </div>
          )}
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

        {/* 통계 및 글쓰기 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-400 text-sm">
            총<span className="font-bold text-sub-bg">{filteredCommunities.length}</span>개의 게시글
          </p>
          {!isUserFilterMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleWriteClick}
                className="flex items-center gap-2 px-4 py-2 bg-main-bg text-white text-sm font-medium
                         hover:bg-sub-bg transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                글쓰기
              </button>
            </div>
          )}
        </div>

        {/* 공지글 */}
        {!isUserFilterMode && kindFilter === 'ALL' && noticePosts.length > 0 && (
          <div className="mb-4 space-y-2">
            {noticePosts.map((post) => (
              <CommunityPostList
                key={post.communityId}
                post={post}
                onClick={handlePostClick}
                formatDate={formatDate}
                getPostTitle={getPostTitle}
                badge={{ text: '공지', color: 'amber' }}
                onAuthorClick={openAuthorPanel}
                selectedAuthor={selectedAuthor}
                selectedAuthorPostId={selectedAuthorPostId}
                onCloseAuthorPanel={closeAuthorPanel}
                onToggleAuthorFollow={handleAuthorFollowToggle}
                authorFollowing={authorFollowing}
                authorFollowLoading={authorFollowLoading}
                currentUser={currentUser}
                onViewAuthorPosts={handleAuthorClick}
              />
            ))}
          </div>
        )}

        {/* 주간 HOT */}
        {!isUserFilterMode && kindFilter === 'ALL' && !searchTerm.trim() && hotPosts.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-col items-center mb-3 border-t border-gray-300">
              <h2 className="text-2xl font-extrabold text-sub-bg pt-3">주간 HOT</h2>
              <span className="text-xs text-gray-400">최근 7일간 인기 게시글</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotPosts.map((post) => (
                <div key={`hot-${post.communityId}`}>
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
                    preferBookInfo={post.communityKind === 'REVIEW'}
                    isHot={true}
                    onBookmark={handleBookmark}
                    bookmarkedBookIds={bookmarkedBookIds}
                    likedCommunityIds={likedCommunityIds}
                    userTitles={userTitles}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 전체 게시글 헤더 */}
        {!isUserFilterMode && kindFilter === 'ALL' && !searchTerm.trim() && hotPosts.length > 0 && filteredCommunities.length > 0 && (
          <div className="flex items-center justify-center border-t border-gray-300 gap-2 mb-3 pt-4">
            <h2 className="text-2xl font-extrabold text-sub-bg">전체 게시글</h2>
          </div>
        )}

        {/* 게시글 목록 */}
        {filteredCommunities.length === 0 && noticePosts.length === 0 ? (
          <EmptyState
            title={searchTerm ? '검색 결과가 없습니다' : '아직 게시글이 없습니다'}
            description={searchTerm ? '다른 키워드로 검색해보세요!' : '첫번째 글을 작성해보세요!'}
          />
        ) : filteredCommunities.length === 0 ? (
          <EmptyState
            title={searchTerm ? '검색 결과가 없습니다' : kindFilter === 'NOTICE' ? '공지글이 없습니다' : '일반 게시글이 없습니다'}
            variant="minimal"
          />
        ) : kindFilter === 'NOTICE' ? (
          <>
            <div className="space-y-2">
              {currentPosts.map((post) => (
                <CommunityPostList
                  key={post.communityId}
                  post={post}
                  onClick={handlePostClick}
                  formatDate={formatDate}
                  getPostTitle={getPostTitle}
                  badge={getBadgeConfig(post, true)}
                  onAuthorClick={openAuthorPanel}
                  selectedAuthor={selectedAuthor}
                  selectedAuthorPostId={selectedAuthorPostId}
                  onCloseAuthorPanel={closeAuthorPanel}
                  onToggleAuthorFollow={handleAuthorFollowToggle}
                  authorFollowing={authorFollowing}
                  authorFollowLoading={authorFollowLoading}
                  currentUser={currentUser}
                  onViewAuthorPosts={handleAuthorClick}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : kindFilter === 'REVIEW' ? (
          <>
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
                    preferBookInfo={true}
                    onBookmark={handleBookmark}
                    bookmarkedBookIds={bookmarkedBookIds}
                    likedCommunityIds={likedCommunityIds}
                    userTitles={userTitles}
                  />
                </div>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <>
            <div className="border-t border-b border-gray-200">
              <div className="flex items-center gap-3 bg-gray-50 border-b border-gray-200 py-2 px-2 text-xs text-gray-500 font-medium">
                <span className="w-12">분류</span>
                <span className="flex-1">제목</span>
                <span className="w-44 text-center">작성자</span>
                <span className="w-20 text-center">날짜</span>
                <span className="w-10 text-center">추천</span>
              </div>
              <div>
                {currentPosts.map((post) => (
                  <CommunityPostList
                    key={post.communityId}
                    post={post}
                    onClick={handlePostClick}
                    formatDate={formatDate}
                    getPostTitle={getPostTitle}
                    badge={getBadgeConfig(post)}
                    isHot={kindFilter === 'ALL' && hotPostIds.has(post.communityId)}
                    variant="table"
                    userTitles={userTitles}
                    onAuthorClick={openAuthorPanel}
                    selectedAuthor={selectedAuthor}
                    selectedAuthorPostId={selectedAuthorPostId}
                    onCloseAuthorPanel={closeAuthorPanel}
                    onToggleAuthorFollow={handleAuthorFollowToggle}
                    authorFollowing={authorFollowing}
                    authorFollowLoading={authorFollowLoading}
                    currentUser={currentUser}
                    onViewAuthorPosts={handleAuthorClick}
                  />
                ))}
              </div>
            </div>
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
