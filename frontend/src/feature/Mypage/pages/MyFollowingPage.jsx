import { useState } from 'react'

function MyFollowingPage() {
  const [activeTab, setActiveTab] = useState('following')

  // 더미 데이터 (실제 구현 시 API 연동)
  const dummyFollowing = [
    { id: 1, nickname: '책읽는사람', bio: '매일 한 권씩 읽는 게 목표입니다', postCount: 45, followerCount: 128 },
    { id: 2, nickname: '문학소녀', bio: '문학 전공, 책 리뷰 올려요', postCount: 89, followerCount: 256 },
    { id: 3, nickname: '독서광', bio: '장르 불문 다 읽습니다', postCount: 34, followerCount: 87 },
  ]

  const dummyFollowers = [
    { id: 1, nickname: '초보독자', bio: '이제 막 책 읽기 시작했어요', postCount: 5, followerCount: 12 },
    { id: 2, nickname: '서울시민', bio: '', postCount: 0, followerCount: 3 },
  ]

  const tabs = [
    { id: 'following', label: '팔로잉', count: dummyFollowing.length },
    { id: 'followers', label: '팔로워', count: dummyFollowers.length },
  ]

  const currentList = activeTab === 'following' ? dummyFollowing : dummyFollowers

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
            className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 ${
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
      <div className="border border-gray-200">
        {currentList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {activeTab === 'following' ? '팔로잉하는 사람이 없습니다.' : '팔로워가 없습니다.'}
          </div>
        ) : (
          currentList.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                index !== currentList.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {/* 프로필 */}
                <div className="w-10 h-10 rounded-full bg-main-bg flex items-center justify-center text-white font-bold text-sm">
                  {user.nickname.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-800">{user.nickname}</h3>
                  <p className="text-xs text-gray-400">
                    {user.bio || '소개 없음'} · 게시글 {user.postCount} · 팔로워 {user.followerCount}
                  </p>
                </div>
              </div>
              <button 
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === 'following'
                    ? 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                    : 'bg-main-bg text-white hover:bg-sub-bg'
                }`}
              >
                {activeTab === 'following' ? '언팔로우' : '맞팔로우'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MyFollowingPage
