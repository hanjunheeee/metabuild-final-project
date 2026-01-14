import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchHallOfFame } from '../api/communityApi'
import { Spinner } from '@/shared/components/icons'

const BASE_URL = 'http://localhost:7878'

function CommunityRankPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [followerRank, setFollowerRank] = useState([])
  const [commentLikeRank, setCommentLikeRank] = useState([])

  useEffect(() => {
    const loadRankings = async () => {
      try {
        setLoading(true)
        const data = await fetchHallOfFame(10)
        setFollowerRank(data.topByFollowers || [])
        setCommentLikeRank(data.topByLikes || [])
      } catch (err) {
        console.error('랭킹 조회 실패:', err)
        setError('랭킹을 불러오는 데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadRankings()
  }, [])

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  const formatCount = (count) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K'
    }
    return count.toLocaleString()
  }

  const getProfileImageUrl = (userPhoto) => {
    if (!userPhoto) return null
    if (userPhoto.startsWith('http')) return userPhoto
    return `${BASE_URL}/uploads/profile/${userPhoto}`
  }

  const RankCard = ({ user, type }) => {
    const emoji = getRankEmoji(user.rank)
    const count = user.count
    const label = type === 'follower' ? '팔로워' : '좋아요'
    const profileImageUrl = getProfileImageUrl(user.userPhoto)
    
    return (
      <div 
        className="flex items-center gap-4 p-3 border-b border-gray-100 transition-colors hover:bg-gray-50 cursor-pointer"
        onClick={() => navigate(`/community?userId=${user.userId}&userName=${encodeURIComponent(user.nickname)}`)}
      >
        {/* 순위 */}
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm bg-gray-200 text-gray-600">
          {emoji || user.rank}
        </div>
        
        {/* 프로필 이미지 */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-main-bg flex items-center justify-center text-white font-bold text-sm overflow-hidden">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={user.nickname} className="w-full h-full object-cover" />
          ) : (
            user.nickname?.charAt(0) || '?'
          )}
        </div>
        
        {/* 닉네임 */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-gray-800">
            {user.nickname}
          </p>
          <p className="text-xs text-gray-400">
            {label} {formatCount(count)}
          </p>
        </div>
        
        {/* 이동 화살표 */}
        <div className="flex-shrink-0 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    )
  }

  const EmptyRankMessage = ({ type }) => (
    <div className="p-8 text-center text-gray-400 text-sm">
      {type === 'follower' 
        ? '아직 팔로워를 보유한 유저가 없습니다.' 
        : '아직 댓글 좋아요를 받은 유저가 없습니다.'}
    </div>
  )

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-10 h-10 text-main-bg" />
          <p className="text-gray-400 text-sm">랭킹을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-sub-bg mb-2">
            🏆 명예의 전당
          </h1>
          <p className="text-gray-400 text-sm">
            우리 커뮤니티에서 가장 활발하게 활동하는 독서 리더들을 만나보세요!
          </p>
        </div>

        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => navigate('/community')}
          className="flex items-center gap-2 text-gray-400 hover:text-main-bg transition-colors mb-6 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">커뮤니티로 돌아가기</span>
        </button>

        {/* 랭킹 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 팔로워 랭킹 */}
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">👥</span>
                <div>
                  <h2 className="text-base font-bold text-sub-bg">팔로워 TOP 10</h2>
                  <p className="text-gray-400 text-xs">가장 많은 팔로워를 보유한 인기 유저</p>
                </div>
              </div>
            </div>
            <div>
              {followerRank.length > 0 ? (
                followerRank.map((user) => (
                  <RankCard key={`follower-${user.userId}`} user={user} type="follower" />
                ))
              ) : (
                <EmptyRankMessage type="follower" />
              )}
            </div>
          </div>

          {/* 댓글 좋아요 랭킹 */}
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">❤️</span>
                <div>
                  <h2 className="text-base font-bold text-sub-bg">댓글 좋아요 TOP 10</h2>
                  <p className="text-gray-400 text-xs">댓글로 가장 많은 공감을 받은 유저</p>
                </div>
              </div>
            </div>
            <div>
              {commentLikeRank.length > 0 ? (
                commentLikeRank.map((user) => (
                  <RankCard key={`comment-${user.userId}`} user={user} type="comment" />
                ))
              ) : (
                <EmptyRankMessage type="comment" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommunityRankPage
