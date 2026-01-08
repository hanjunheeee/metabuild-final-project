function PostManagePage() {
  // 더미 게시글 데이터
  const posts = [
    { id: 1, title: '독서 모임 후기입니다', author: 'user123', kind: '자유', createdAt: '2026-01-08', reports: 0 },
    { id: 2, title: '이 책 추천합니다!', author: 'bookworm', kind: '리뷰', createdAt: '2026-01-07', reports: 2 },
    { id: 3, title: 'React 질문있어요', author: 'dev_kim', kind: '질문', createdAt: '2026-01-06', reports: 0 },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">커뮤니티 게시글 관리</h2>
      </div>

      {/* 필터 */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="제목, 작성자 검색..."
          className="flex-1 md:flex-initial md:w-80 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg"
        />
        <select className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg">
          <option value="">전체 종류</option>
          <option value="FREE">자유</option>
          <option value="REVIEW">리뷰</option>
          <option value="QUESTION">질문</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-y border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">제목</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">작성자</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">종류</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">작성일</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">신고</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{post.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{post.title}</td>
                <td className="px-4 py-3 text-gray-600">{post.author}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${
                    post.kind === '자유' ? 'bg-blue-100 text-blue-700' :
                    post.kind === '리뷰' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {post.kind}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{post.createdAt}</td>
                <td className="px-4 py-3">
                  {post.reports > 0 ? (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                      {post.reports}건
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button className="text-blue-600 hover:underline mr-3">보기</button>
                  <button className="text-red-600 hover:underline">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PostManagePage

