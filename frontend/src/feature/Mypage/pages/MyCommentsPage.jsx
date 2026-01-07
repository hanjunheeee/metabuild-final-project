import { useState } from 'react'

function MyCommentsPage() {
  const [activeTab, setActiveTab] = useState('comments')

  // 더미 데이터 (실제 구현 시 API 연동)
  const dummyComments = [
    { id: 1, content: '좋은 글 감사합니다!', postTitle: '첫 번째 게시글', createdAt: '2025-01-06' },
    { id: 2, content: '저도 같은 생각이에요.', postTitle: '리뷰: 데미안을 읽고', createdAt: '2025-01-05' },
    { id: 3, content: '참고가 많이 됐습니다.', postTitle: '독서 모임 후기', createdAt: '2025-01-04' },
  ]

  const dummyReplies = [
    { id: 1, content: '네, 맞습니다!', parentComment: '질문이 있어요', postTitle: '도서관 이용 문의', createdAt: '2025-01-06' },
    { id: 2, content: '확인해보세요.', parentComment: '잘 모르겠어요', postTitle: '추천 부탁드려요', createdAt: '2025-01-03' },
  ]

  const tabs = [
    { id: 'comments', label: '댓글', count: dummyComments.length },
    { id: 'replies', label: '답글', count: dummyReplies.length },
  ]

  const currentList = activeTab === 'comments' ? dummyComments : dummyReplies

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">내 댓글 & 답글</h2>
        <p className="text-gray-400 text-sm mt-1">내가 작성한 댓글과 답글을 확인할 수 있습니다.</p>
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
            {activeTab === 'comments' ? '작성한 댓글이 없습니다.' : '작성한 답글이 없습니다.'}
          </div>
        ) : (
          currentList.map((item, index) => (
            <div
              key={item.id}
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                index !== currentList.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 mb-1">{item.content}</p>
                  <div className="text-xs text-gray-400">
                    {activeTab === 'replies' && (
                      <span className="mr-2">"{item.parentComment}"에 대한 답글</span>
                    )}
                    <span className="text-main-bg hover:underline">{item.postTitle}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs text-gray-400">{item.createdAt}</span>
                  <button className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-red-500 border border-red-300 hover:bg-red-50 transition-all">
                    삭제
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

export default MyCommentsPage
