import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchUsers } from '../api/adminUserApi'
import { fetchCommunities } from '@/feature/Community/api/communityApi'

function AdminDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    todayUsers: 0,
    todayPosts: 0,
  })
  const [recentPosts, setRecentPosts] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      try {
        const [usersData, postsData] = await Promise.all([
          fetchUsers(),
          fetchCommunities()
        ])

        const users = Array.isArray(usersData) ? usersData : []
        const posts = Array.isArray(postsData) ? postsData : []

        // 오늘 날짜 기준
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // 오늘 가입한 회원 수
        const todayUsers = users.filter(user => {
          if (!user.createdAt) return false
          const createdAt = new Date(user.createdAt)
          return createdAt >= today
        })

        // 오늘 작성된 게시글 수
        const todayPosts = posts.filter(post => {
          if (!post.createdAt) return false
          const createdAt = new Date(post.createdAt)
          return createdAt >= today
        })

        setStats({
          totalUsers: users.length,
          totalPosts: posts.length,
          todayUsers: todayUsers.length,
          todayPosts: todayPosts.length,
        })

        // 최근 게시글 5개 (최신순)
        const sortedPosts = [...posts]
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 5)
        setRecentPosts(sortedPosts)

        // 최근 가입 회원 3명 (최신순)
        const sortedUsers = [...users]
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 3)
        setRecentUsers(sortedUsers)

      } catch (e) {
        console.error('Failed to load dashboard data:', e)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

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

  // 상대 시간 계산
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000) // 초 단위

    if (diff < 60) return '방금 전'
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  const statCards = [
    { label: '전체 회원', value: stats.totalUsers, color: 'bg-blue-500', icon: '👥' },
    { label: '전체 게시글', value: stats.totalPosts, color: 'bg-green-500', icon: '📝' },
    { label: '오늘 가입', value: stats.todayUsers, color: 'bg-purple-500', icon: '🆕' },
    { label: '오늘 게시글', value: stats.todayPosts, color: 'bg-orange-500', icon: '📰' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">관리자 대시보드</h2>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <span className="text-white text-lg">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 최근 활동 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 최근 게시글 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">최근 게시글</h3>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-gray-400">등록된 게시글이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div 
                  key={post.communityId} 
                  className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-100 rounded px-2 py-1 -mx-2 transition-colors"
                  onClick={() => navigate(`/community/${post.communityId}`)}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${post.isNotice === 1 ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                  <span className="text-gray-600 truncate flex-1 hover:text-main-bg">
                    {post.isNotice === 1 && <span className="text-orange-500 font-medium">[공지] </span>}
                    {getPostTitle(post)}
                  </span>
                  <span className="text-gray-400 text-xs whitespace-nowrap">{getRelativeTime(post.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 최근 가입 회원 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">최근 가입 회원</h3>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-gray-400">등록된 회원이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.userId} className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-600 flex-1">
                    <span className="font-medium">{user.nickname || '(닉네임 없음)'}</span>
                    <span className="text-gray-400 ml-2">{user.email}</span>
                  </span>
                  <span className="text-gray-400 text-xs whitespace-nowrap">{getRelativeTime(user.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
