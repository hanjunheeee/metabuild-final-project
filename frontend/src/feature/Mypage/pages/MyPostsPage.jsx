import { useState } from 'react'

function MyPostsPage() {
  const [activeTab, setActiveTab] = useState('all')

  // 더미 데이터 (실제 구현 시 API 연동)
  const dummyPosts = [
    { id: 1, title: '첫 번째 게시글입니다', kind: 'FREE', createdAt: '2025-01-05', likes: 12, comments: 3 },
    { id: 2, title: '리뷰: 데미안을 읽고', kind: 'REVIEW', createdAt: '2025-01-03', likes: 28, comments: 7 },
    { id: 3, title: '질문이 있습니다', kind: 'QUESTION', createdAt: '2025-01-01', likes: 5, comments: 2 },
  ]

  const tabs = [
    { id: 'all', label: '전체' },
    { id: 'FREE', label: '자유글' },
    { id: 'REVIEW', label: '리뷰' },
    { id: 'QUESTION', label: '질문' },
  ]

  const getKindBadge = (kind) => {
    const styles = {
      FREE: 'bg-blue-100 text-blue-700',
      REVIEW: 'bg-purple-100 text-purple-700',
      QUESTION: 'bg-green-100 text-green-700',
    }
    const labels = { FREE: '자유', REVIEW: '리뷰', QUESTION: '질문' }
    return (
      <span className={`px-2 py-0.5 text-xs font-medium ${styles[kind] || 'bg-gray-100 text-gray-700'}`}>
        {labels[kind] || kind}
      </span>
    )
  }

  const filteredPosts = activeTab === 'all' 
    ? dummyPosts 
    : dummyPosts.filter(post => post.kind === activeTab)

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">내 게시글</h2>
        <p className="text-gray-400 text-sm mt-1">내가 작성한 게시글을 확인하고 관리할 수 있습니다.</p>
      </div>

      {/* 탭 필터 */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-main-bg text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 통계 */}
      <div className="flex gap-4 mb-6 text-sm text-gray-500">
        <span>총 게시글 <strong className="text-gray-800">{dummyPosts.length}</strong>개</span>
        <span>받은 좋아요 <strong className="text-gray-800">{dummyPosts.reduce((acc, p) => acc + p.likes, 0)}</strong>개</span>
        <span>받은 댓글 <strong className="text-gray-800">{dummyPosts.reduce((acc, p) => acc + p.comments, 0)}</strong>개</span>
      </div>

      {/* 게시글 목록 */}
      <div className="border border-gray-200">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            작성한 게시글이 없습니다.
          </div>
        ) : (
          filteredPosts.map((post, index) => (
            <div
              key={post.id}
              className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                index !== filteredPosts.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {getKindBadge(post.kind)}
                <h3 className="text-sm font-medium text-gray-800 truncate group-hover:text-main-bg transition-colors">
                  {post.title}
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
                <span>좋아요 {post.likes}</span>
                <span>댓글 {post.comments}</span>
                <span>{post.createdAt}</span>
                <button className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-main-bg text-white text-xs transition-all hover:bg-sub-bg">
                  수정
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MyPostsPage
