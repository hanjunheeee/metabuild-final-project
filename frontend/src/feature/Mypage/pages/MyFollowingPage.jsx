import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchFollowingList, fetchFollowersList, toggleFollow } from '@/shared/api/followApi'
import { getUserFromSession } from '@/shared/api/authApi'
import { Spinner } from '@/shared/components/icons'

const API_BASE_URL = 'http://localhost:7878'

function MyFollowingPage() {
  const [activeTab, setActiveTab] = useState('following')
  const [followingList, setFollowingList] = useState([])
  const [followersList, setFollowersList] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  
  const currentUser = getUserFromSession()

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.userId) return
      
      setLoading(true)
      try {
        const [following, followers] = await Promise.all([
          fetchFollowingList(currentUser.userId, currentUser.userId),
          fetchFollowersList(currentUser.userId, currentUser.userId)
        ])
        setFollowingList(following)
        setFollowersList(followers)
      } catch (error) {
        console.error('팔로우 데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [currentUser?.userId])

  // 팔로우/언팔로우 토글
  const handleToggleFollow = async (targetUserId, isCurrentlyFollowing) => {
    if (!currentUser?.userId) return

    try {
      const result = await toggleFollow(currentUser.userId, targetUserId)
      if (result.success) {
        // 상태 업데이트
        if (activeTab === 'following') {
          if (!result.isFollowing) {
            // 언팔로우 - 팔로잉 목록에서 제거
            setFollowingList(prev => prev.filter(u => u.userId !== targetUserId))
          }
        } else {
          // 팔로워 탭에서 맞팔로우/언팔로우
          setFollowersList(prev => prev.map(u => 
            u.userId === targetUserId ? { ...u, isFollowing: result.isFollowing } : u
          ))
          // 맞팔로우 시 팔로잉 목록도 업데이트
          if (result.isFollowing) {
            const targetUser = followersList.find(u => u.userId === targetUserId)
            if (targetUser && !followingList.some(u => u.userId === targetUserId)) {
              setFollowingList(prev => [targetUser, ...prev])
            }
          } else {
            setFollowingList(prev => prev.filter(u => u.userId !== targetUserId))
          }
        }
      }
    } catch (error) {
      console.error('팔로우 토글 실패:', error)
    }
  }

  // 프로필 이미지 URL 생성
  const getProfileImageUrl = (userPhoto) => {
    if (!userPhoto) return null
    if (userPhoto.startsWith('http')) return userPhoto
    return `${API_BASE_URL}/uploads/profile/${userPhoto}`
  }

  // 사용자 게시글 페이지로 이동
  const handleUserClick = (user) => {
    if (user.userId === currentUser?.userId) {
      navigate('/mypage/posts')
    } else {
      navigate(`/community?userId=${user.userId}&userName=${encodeURIComponent(user.nickname)}`)
    }
  }

  const tabs = [
    { id: 'following', label: '팔로잉', count: followingList.length },
    { id: 'followers', label: '팔로워', count: followersList.length },
  ]

  const currentList = activeTab === 'following' ? followingList : followersList

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
        <h2 className="text-lg font-bold text-gray-800">팔로잉 / 팔로워</h2>
        <p className="text-gray-400 text-sm mt-1">나를 팔로우하거나 내가 팔로우하는 사람을 확인할 수 있습니다.</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-main-bg text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 text-xs ${
              activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="border border-gray-200 shadow-sm">
        {currentList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {activeTab === 'following' ? '팔로잉하는 사람이 없습니다.' : '팔로워가 없습니다.'}
          </div>
        ) : (
          currentList.map((user, index) => (
            <div
              key={user.userId}
              className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                index !== currentList.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => handleUserClick(user)}
              >
                {/* 프로필 이미지 */}
                {getProfileImageUrl(user.userPhoto) ? (
                  <img
                    src={getProfileImageUrl(user.userPhoto)}
                    alt={user.nickname}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-main-bg flex items-center justify-center text-white font-bold text-sm">
                    {user.nickname?.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-gray-800 hover:text-main-bg transition-colors">
                    {user.nickname}
                  </h3>
                  <p className="text-xs text-gray-400">
                    게시글 {user.postCount || 0} · 팔로워 {user.followerCount || 0}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleToggleFollow(user.userId, user.isFollowing)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'following' || user.isFollowing
                    ? 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                    : 'bg-main-bg text-white hover:bg-sub-bg'
                }`}
              >
                {activeTab === 'following' ? '언팔로우' : (user.isFollowing ? '언팔로우' : '맞팔로우')}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MyFollowingPage
