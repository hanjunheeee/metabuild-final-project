function MyLikesPage() {
  // 더미 데이터 (실제 구현 시 API 연동)
  const dummyLikedPosts = [
    { id: 1, title: '2025년 읽어볼 만한 책 추천', author: '책읽는사람', kind: 'FREE', createdAt: '2025-01-05', likes: 156 },
    { id: 2, title: '데미안 - 헤르만 헤세 리뷰', author: '문학소녀', kind: 'REVIEW', createdAt: '2025-01-03', likes: 89 },
    { id: 3, title: '독서 모임 하실 분 계신가요?', author: '독서광', kind: 'FREE', createdAt: '2025-01-02', likes: 45 },
    { id: 4, title: '어린왕자 어떤 번역본이 좋을까요?', author: '초보독자', kind: 'QUESTION', createdAt: '2025-01-01', likes: 32 },
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

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">좋아요한 글</h2>
        <p className="text-gray-400 text-sm mt-1">내가 좋아요를 누른 게시글을 확인할 수 있습니다.</p>
      </div>

      {/* 통계 */}
      <div className="mb-6 text-sm text-gray-500">
        총 <strong className="text-gray-800">{dummyLikedPosts.length}</strong>개의 글에 좋아요
      </div>

      {/* 게시글 목록 */}
      <div className="border border-gray-200">
        {dummyLikedPosts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            좋아요한 게시글이 없습니다.
          </div>
        ) : (
          dummyLikedPosts.map((post, index) => (
            <div
              key={post.id}
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                index !== dummyLikedPosts.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {getKindBadge(post.kind)}
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-gray-800 truncate group-hover:text-main-bg transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-400">by {post.author}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
                  <span>좋아요 {post.likes}</span>
                  <span>{post.createdAt}</span>
                  <button 
                    className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-red-500 border border-red-300 hover:bg-red-50 transition-all"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MyLikesPage
