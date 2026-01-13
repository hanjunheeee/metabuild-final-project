import { useState, useEffect } from 'react'
import { getUserFromSession } from '@/shared/api/authApi'

const API_BASE_URL = 'http://localhost:7878'

function TitleHistoryPage() {
  const user = getUserFromSession()
  const [titles, setTitles] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTitles = async () => {
      if (!user?.userId) return
      try {
        const res = await fetch(`${API_BASE_URL}/api/titles/user/${user.userId}`)
        const data = await res.json()
        // 최신순 정렬
        const sorted = (data || []).sort((a, b) => 
          new Date(b.achievedAt) - new Date(a.achievedAt)
        )
        setTitles(sorted)
      } catch (err) {
        console.error('칭호 조회 실패:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTitles()
  }, [user?.userId])

  // 날짜 포맷
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 레벨별 스타일
  const getLevelStyle = (level) => {
    switch (level) {
      case 'GOLD':
        return 'bg-white border-gray-300 text-gray-800'
      case 'SILVER':
        return 'bg-white border-gray-200 text-gray-700'
      case 'BRONZE':
        return 'bg-white border-gray-200 text-gray-600'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600'
    }
  }

  // 레벨 태그
  const getLevelTag = (level) => {
    switch (level) {
      case 'GOLD':
        return { text: 'Lv.3', style: 'bg-sub-bg text-white' }
      case 'SILVER':
        return { text: 'Lv.2', style: 'bg-gray-500 text-white' }
      case 'BRONZE':
        return { text: 'Lv.1', style: 'bg-main-bg text-white' }
      default:
        return { text: '', style: '' }
    }
  }

  // 타입별 설명
  const getTypeDescription = (type) => {
    return type === 'LIKE' ? '댓글 좋아요 달성' : '팔로워 달성'
  }

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-sub-bg">칭호 이력</h2>
        <p className="text-gray-400 text-sm mt-1">
          획득한 칭호와 달성 일시를 확인할 수 있습니다.
        </p>
      </div>

      {/* 칭호 통계 */}
      {!isLoading && titles.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 border border-gray-200 p-4 text-center">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-2xl font-bold text-sub-bg">{titles.length}</div>
            <div className="text-xs text-gray-400">획득한 칭호</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 p-4 text-center">
            <div className="text-2xl mb-1">❤️</div>
            <div className="text-2xl font-bold text-sub-bg">
              {titles.filter(t => t.titleType === 'LIKE').length}
            </div>
            <div className="text-xs text-gray-400">좋아요 칭호</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 p-4 text-center">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-2xl font-bold text-sub-bg">
              {titles.filter(t => t.titleType === 'FOLLOWER').length}
            </div>
            <div className="text-xs text-gray-400">팔로워 칭호</div>
          </div>
        </div>
      )}

      {/* 칭호 목록 */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin w-8 h-8 border-2 border-main-bg border-t-transparent rounded-full mx-auto mb-3"></div>
          로딩 중...
        </div>
      ) : titles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-gray-500 mb-2">아직 획득한 칭호가 없습니다.</p>
          <p className="text-sm text-gray-400">
            댓글에 좋아요를 받거나 팔로워를 늘려 칭호를 획득해보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {titles.map((title) => (
            <div
              key={title.titleId}
              className={`p-4 border ${getLevelStyle(title.titleLevel)} transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getLevelTag(title.titleLevel).text && (
                    <span className={`text-xs px-2 py-1 font-bold ${getLevelTag(title.titleLevel).style}`}>
                      {getLevelTag(title.titleLevel).text}
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{title.titleName}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {getTypeDescription(title.titleType)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">달성일</div>
                  <div className="text-sm font-medium text-gray-600">
                    {formatDate(title.achievedAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 칭호 기준 안내 */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-sub-bg mb-3">📋 칭호 획득 기준</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-50 p-3 border border-gray-200">
            <div className="font-medium text-gray-700 mb-2">❤️ 댓글 좋아요</div>
            <ul className="space-y-1 text-gray-500">
              <li><span className="text-main-bg font-medium">Lv.1</span> 100개 → 공감의 시작</li>
              <li><span className="text-main-bg font-medium">Lv.2</span> 1,000개 → 공감 유발자</li>
              <li><span className="text-main-bg font-medium">Lv.3</span> 2,000개 → 소통의 달인</li>
            </ul>
          </div>
          <div className="bg-gray-50 p-3 border border-gray-200">
            <div className="font-medium text-gray-700 mb-2">👥 팔로워</div>
            <ul className="space-y-1 text-gray-500">
              <li><span className="text-main-bg font-medium">Lv.1</span> 10명 → 책방 이웃</li>
              <li><span className="text-main-bg font-medium">Lv.2</span> 100명 → 도서 큐레이터</li>
              <li><span className="text-main-bg font-medium">Lv.3</span> 500명 → 독서 인플루언서</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TitleHistoryPage
