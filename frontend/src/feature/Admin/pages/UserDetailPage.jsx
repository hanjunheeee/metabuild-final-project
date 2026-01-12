import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCommunities } from '@/feature/Community/api/communityApi'

const BASE_URL = 'http://localhost:7878'

function UserDetailPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true)
      try {
        // 사용자 정보 조회
        const userRes = await fetch(`${BASE_URL}/api/users/${userId}`)
        const userData = await userRes.json()
        setUser(userData)

        // 전체 게시글에서 해당 사용자 게시글 필터링
        const allPosts = await fetchCommunities()
        const userPosts = (Array.isArray(allPosts) ? allPosts : [])
          .filter(post => post.userId === Number(userId))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        setPosts(userPosts)

        // 사용자 댓글 조회
        const commentsRes = await fetch(`${BASE_URL}/api/comments/user/${userId}`)
        const commentsData = await commentsRes.json()
        setComments(Array.isArray(commentsData) ? commentsData : [])

      } catch (e) {
        console.error('Failed to load user data:', e)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadUserData()
    }
  }, [userId])

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

  // 날짜 포맷
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // 상대 시간
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return '방금 전'
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
    return formatDate(dateStr)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">사용자를 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/admin/users')}
          className="text-main-bg hover:underline"
        >
          회원 목록으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm">회원 목록</span>
      </button>

      {/* 회원 정보 카드 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* 프로필 이미지 */}
          <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            {user.userPhoto ? (
              <img 
                src={`${BASE_URL}/uploads/profile/${user.userPhoto}`}
                alt={user.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-main-bg text-white text-xl font-bold">
                {(user.nickname || user.email || '?')[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* 정보 */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800">
              {user.nickname || '(닉네임 없음)'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <span className="text-gray-600">
                가입일: <span className="font-medium">{formatDate(user.createdAt)}</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                user.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {user.role === 'ADMIN' ? '관리자' : '일반 회원'}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                user.isActive === 'Y' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {user.isActive === 'Y' ? '활성' : '비활성'}
              </span>
            </div>
          </div>

          {/* 통계 */}
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-main-bg">{posts.length}</p>
              <p className="text-xs text-gray-500">게시글</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-main-bg">{comments.length}</p>
              <p className="text-xs text-gray-500">댓글</p>
            </div>
          </div>
        </div>
      </div>

      {/* 게시글 / 댓글 탭 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 작성 게시글 */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">📝 작성 게시글</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {posts.length === 0 ? (
              <p className="text-sm text-gray-400 p-4">작성한 게시글이 없습니다.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {posts.slice(0, 10).map((post) => (
                  <div 
                    key={post.communityId}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/community/${post.communityId}`)}
                  >
                    <p className="text-sm text-gray-800 truncate hover:text-main-bg">
                      {post.isNotice === 1 && <span className="text-orange-500 font-medium">[공지] </span>}
                      {getPostTitle(post)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{getRelativeTime(post.createdAt)}</p>
                  </div>
                ))}
                {posts.length > 10 && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    외 {posts.length - 10}개 더...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 작성 댓글 */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">💬 작성 댓글</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-400 p-4">작성한 댓글이 없습니다.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {comments.slice(0, 10).map((comment) => (
                  <div 
                    key={comment.commentId}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/community/${comment.communityId}`)}
                  >
                    <p className="text-sm text-gray-800 truncate hover:text-main-bg">
                      {comment.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{getRelativeTime(comment.createdAt)}</p>
                  </div>
                ))}
                {comments.length > 10 && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    외 {comments.length - 10}개 더...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDetailPage

