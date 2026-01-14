import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCommunityById, deleteCommunity, likeCommunity, checkLike, fetchHallOfFame } from '../api/communityApi'
import { Spinner } from '@/shared/components/icons'
import { getUserFromSession } from '@/shared/api/authApi'
import { checkBookmark, toggleBookmark } from '@/shared/api/bookmarkApi'
import { CommentSection, BookInfoCard } from '../components'

function CommunityDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [isHallOfFameAuthor, setIsHallOfFameAuthor] = useState(false)
  
  const currentUser = getUserFromSession()

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true)
        const data = await fetchCommunityById(id)
        setPost(data)
        setLikeCount(data.communityGreat || 0)
        
        // 로그인한 사용자의 좋아요 여부 확인
        if (currentUser?.userId) {
          const likeResult = await checkLike(id, currentUser.userId)
          if (likeResult.success) {
            setLiked(likeResult.liked)
          }
          
          // 책이 있으면 북마크 여부도 확인
          if (data.bookId) {
            const bookmarkResult = await checkBookmark(currentUser.userId, data.bookId)
            if (bookmarkResult.success) {
              setBookmarked(bookmarkResult.bookmarked)
            }
          }
        }
      } catch (err) {
        console.error('게시글 로딩 실패:', err)
        setError('게시글을 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }
    loadPost()
  }, [id, currentUser?.userId])

  useEffect(() => {
    const loadHallOfFame = async () => {
      if (!post?.userId) return
      try {
        const data = await fetchHallOfFame(10)
        const ids = new Set()
        ;(data?.topByFollowers || []).forEach(user => ids.add(user.userId))
        ;(data?.topByLikes || []).forEach(user => ids.add(user.userId))
        setIsHallOfFameAuthor(ids.has(post.userId))
      } catch (err) {
        console.error('?ª…ì˜ˆ???„ë‹¹ ì¡°íšŒ ?¤íŒ¨:', err)
      }
    }
    loadHallOfFame()
  }, [post?.userId])

  // 날짜 포맷
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 게시글 제목 추출
  const getPostTitle = () => {
    if (!post) return ''
    try {
      const parsed = JSON.parse(post.contentJson || '{}')
      return parsed.title || '제목 없음'
    } catch {
      return '제목 없음'
    }
  }

  // 게시글 내용 추출
  const getPostContent = () => {
    if (!post) return ''
    try {
      const parsed = JSON.parse(post.contentJson || '{}')
      return parsed.content || ''
    } catch {
      return post.contentJson || ''
    }
  }

  // 게시글 종류 라벨
  const getKindLabel = (kind) => {
    const labels = {
      FREE: '자유',
      QUESTION: '질문',
      REVIEW: '리뷰',
    }
    return labels[kind] || kind
  }

  // 게시글 종류 색상
  const getKindColor = (kind) => {
    const colors = {
      FREE: 'bg-blue-100 text-blue-700',
      QUESTION: 'bg-green-100 text-green-700',
      REVIEW: 'bg-purple-100 text-purple-700',
    }
    return colors[kind] || 'bg-gray-100 text-gray-700'
  }

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      return
    }
    
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      // 관리자가 삭제 시 userId를 null로 전달 (작성자 확인 생략)
      const userIdParam = (currentUser.role === 'ADMIN' && post.userId !== currentUser.userId) 
        ? null 
        : currentUser.userId
      const result = await deleteCommunity(post.communityId, userIdParam)
      if (result.success) {
        alert('게시글이 삭제되었습니다.')
        navigate('/community')
      } else {
        alert(result.message || '삭제에 실패했습니다.')
      }
    } catch (err) {
      console.error('삭제 실패:', err)
      alert('삭제에 실패했습니다.')
    }
  }

  // 수정 페이지로 이동 (replace로 히스토리에서 상세페이지 대체)
  const handleEdit = () => {
    navigate(`/community/write?edit=${post.communityId}`, { replace: true })
  }

  // 작성자 클릭 시 해당 유저의 게시글 목록으로 이동
  const handleAuthorClick = () => {
    if (currentUser && currentUser.userId === post.userId) {
      navigate('/mypage/posts')
    } else {
      navigate(`/community?userId=${post.userId}&userName=${encodeURIComponent(post.authorNickname || '사용자')}`)
    }
  }

  // 좋아요 핸들러
  const handleLike = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      navigate('/login')
      return
    }

    if (isLiking) return

    try {
      setIsLiking(true)
      const result = await likeCommunity(post.communityId, currentUser.userId)
      if (result.success) {
        setLikeCount(result.likeCount)
        setLiked(result.liked)
      } else {
        alert(result.message || '좋아요에 실패했습니다.')
      }
    } catch (err) {
      console.error('좋아요 실패:', err)
      alert('좋아요에 실패했습니다.')
    } finally {
      setIsLiking(false)
    }
  }

  // 북마크 핸들러
  const handleBookmark = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      navigate('/login')
      return
    }

    if (isBookmarking || !post.bookId) return

    try {
      setIsBookmarking(true)
      const result = await toggleBookmark(currentUser.userId, post.bookId)
      if (result.success) {
        setBookmarked(result.bookmarked)
      }
    } catch (err) {
      console.error('북마크 실패:', err)
    } finally {
      setIsBookmarking(false)
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-10 h-10 text-main-bg" />
          <p className="text-gray-400 text-sm">게시글을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !post) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            {error || '게시글을 찾을 수 없습니다'}
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            삭제되었거나 존재하지 않는 게시글입니다.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-main-bg text-white text-sm hover:bg-sub-bg transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  const isAuthor = currentUser?.userId === post.userId
  const isAdmin = currentUser?.role === 'ADMIN'
  // 수정 권한: 작성자이거나 관리자(공지사항의 경우)
  const canEdit = isAuthor || (isAdmin && post.isNotice === 1)
  // 삭제 권한: 작성자이거나 관리자(모든 글)
  const canDelete = isAuthor || isAdmin

  return (
    <div className="flex-1 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 뒤로가기 */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm cursor-pointer">뒤로가기</span>
        </button>

        {/* 게시글 카드 */}
        <article className="bg-white border border-gray-200 shadow-sm">
          {/* 헤더 */}
          <div className="p-6 border-b border-gray-100">
            {/* 종류 & 공지 태그 */}
            <div className="flex items-center gap-2 mb-3">
              {post.isNotice === 1 ? (
                <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold">
                  공지
                </span>
              ) : (
                <span className={`px-2 py-1 text-xs font-medium ${getKindColor(post.communityKind)}`}>
                  {getKindLabel(post.communityKind)}
                </span>
              )}
            </div>

            {/* 제목 */}
            <h1 className="text-xl font-bold text-gray-900 mb-4">
              {getPostTitle()}
            </h1>

            {/* 작성자 정보 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* 프로필 이미지 (클릭 가능) */}
                <button
                  onClick={handleAuthorClick}
                  className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0
                           hover:ring-2 hover:ring-main-bg transition-all cursor-pointer"
                >
                  {post.authorPhoto ? (
                    <img 
                      src={`http://localhost:7878/uploads/profile/${post.authorPhoto}`}
                      alt={post.authorNickname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-main-bg text-white font-bold">
                      {(post.authorNickname || '?')[0].toUpperCase()}
                    </div>
                  )}
                </button>
                <div>
                  <button
                    onClick={handleAuthorClick}
                    className="text-sm font-medium text-gray-800 hover:text-main-bg transition-colors cursor-pointer"
                  >
                    {post.authorNickname || '익명'}
                    {isHallOfFameAuthor && (
                      <span className="ml-1 text-amber-500 text-xs font-semibold">👑 명예</span>
                    )}
                  </button>
                  <p className="text-xs text-gray-400">
                    {formatDate(post.createdAt)}
                  </p>
                </div>
              </div>

              {/* 수정/삭제 버튼 */}
              {(canEdit || canDelete) && (
                <div className="flex items-center gap-2">
                  {/* 수정 버튼: 작성자 또는 관리자(공지사항) */}
                  {canEdit && (
                    <button
                      onClick={handleEdit}
                      className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 
                               hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      수정
                    </button>
                  )}
                  {/* 삭제 버튼: 작성자 또는 관리자(모든 글) */}
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1.5 text-xs text-red-600 border border-red-300 
                               hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      삭제
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 책 정보 (있는 경우) */}
          {post.bookId && (
            <BookInfoCard
              book={{
                bookId: post.bookId,
                title: post.bookTitle,
                author: post.bookAuthor,
                coverUrl: post.bookCoverUrl,
                publishedDate: post.bookPublishedDate,
              }}
              size="lg"
              showBookmark={!!currentUser}
              isBookmarked={bookmarked}
              onBookmark={handleBookmark}
              bookmarkLoading={isBookmarking}
            />
          )}

          {/* 본문 내용 */}
          <div 
            className="p-6 prose prose-sm max-w-none
                       prose-headings:text-gray-900 
                       prose-p:text-gray-700 prose-p:leading-relaxed
                       prose-a:text-main-bg prose-a:no-underline hover:prose-a:underline
                       prose-img:rounded-lg prose-img:mx-auto prose-img:max-w-full"
            dangerouslySetInnerHTML={{ __html: getPostContent() }}
          />

          {/* 하단 정보 */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                {/* 좋아요 버튼 */}
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full
                           border transition-all duration-200 disabled:opacity-50
                           ${liked 
                             ? 'bg-red-50 border-red-300 text-red-500 cursor-pointer' 
                             : 'bg-white border-gray-200 hover:border-red-300 hover:bg-red-50 group cursor-pointer'
                           }`}
                >
                  <svg 
                    className={`w-4 h-4 transition-colors ${liked ? 'text-red-500' : 'text-gray-400 group-hover:text-red-500'}`}
                    fill={liked ? 'currentColor' : 'none'}
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className={`text-sm font-medium transition-colors ${liked ? 'text-red-500' : 'group-hover:text-red-500'}`}>
                    {likeCount}
                  </span>
                </button>
              </div>
              
              {post.updatedAt && post.updatedAt !== post.createdAt && (
                <span className="text-xs text-gray-400">
                  수정됨: {formatDate(post.updatedAt)}
                </span>
              )}
            </div>
          </div>
        </article>

        {/* 댓글 섹션 */}
        <CommentSection 
          communityId={post.communityId}
          currentUserId={currentUser?.userId}
        />

        {/* 뒤로가기 버튼 */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-main-bg text-sm font-medium border border-main-bg
                      transition-colors cursor-pointer hover:bg-main-bg hover:text-white"
          >
            뒤로가기 →
          </button>
        </div>
      </div>
    </div>
  )
}

export default CommunityDetailPage
