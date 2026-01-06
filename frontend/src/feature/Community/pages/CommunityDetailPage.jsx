import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCommunityById, deleteCommunity, likeCommunity, checkLike } from '../api/communityApi'
import { Spinner } from '@/shared/components/icons'
import { getUserFromSession } from '@/shared/api/authApi'
import CommentSection from '../components/CommentSection'

function CommunityDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  
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
      const result = await deleteCommunity(post.communityId, currentUser.userId)
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

  // 수정 페이지로 이동
  const handleEdit = () => {
    navigate(`/community/write?edit=${post.communityId}`)
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
            onClick={() => navigate('/community')}
            className="px-4 py-2 bg-main-bg text-white text-sm hover:bg-sub-bg transition-colors"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const isAuthor = currentUser?.userId === post.userId

  return (
    <div className="flex-1 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 뒤로가기 */}
        <button
          onClick={() => navigate('/community')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">목록으로</span>
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
                {/* 프로필 이미지 */}
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {post.authorProfileImage ? (
                    <img 
                      src={post.authorProfileImage} 
                      alt={post.authorNickname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-main-bg text-white font-bold">
                      {(post.authorNickname || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {post.authorNickname || '익명'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(post.createdAt)}
                  </p>
                </div>
              </div>

              {/* 수정/삭제 버튼 */}
              {isAuthor && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 
                             hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 text-xs text-red-600 border border-red-300 
                             hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 책 정보 (있는 경우) */}
          {post.bookTitle && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm text-gray-600">
                  <span className="font-medium">{post.bookTitle}</span>
                </span>
              </div>
            </div>
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
          communityAuthorId={post.userId}
          currentUserId={currentUser?.userId}
        />

        {/* 목록으로 버튼 */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => navigate('/community')}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-main-bg text-sm font-medium border border-main-bg
                      transition-colors cursor-pointer hover:bg-main-bg hover:text-white"
          >
            목록으로 돌아가기 →
          </button>
        </div>
      </div>
    </div>
  )
}

export default CommunityDetailPage

