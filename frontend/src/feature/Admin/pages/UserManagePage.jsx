function UserManagePage() {
  // 더미 회원 데이터
  const users = [
    { id: 1, email: 'admin@test.com', nickname: '관리자', role: 'ADMIN', createdAt: '2025-12-01', isActive: 'Y' },
    { id: 2, email: 'user1@test.com', nickname: '독서왕', role: 'USER', createdAt: '2026-01-05', isActive: 'Y' },
    { id: 3, email: 'user2@test.com', nickname: '책벌레', role: 'USER', createdAt: '2026-01-06', isActive: 'Y' },
    { id: 4, email: 'banned@test.com', nickname: '정지회원', role: 'USER', createdAt: '2026-01-01', isActive: 'N' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">회원 관리</h2>
        <div className="text-sm text-gray-500">
          총 <span className="font-bold text-main-bg">{users.length}</span>명
        </div>
      </div>

      {/* 검색/필터 */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="이메일, 닉네임 검색..."
          className="flex-1 md:flex-initial md:w-80 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg"
        />
        <select className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg">
          <option value="">전체 상태</option>
          <option value="Y">활성</option>
          <option value="N">비활성</option>
        </select>
        <select className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg">
          <option value="">전체 역할</option>
          <option value="USER">일반 회원</option>
          <option value="ADMIN">관리자</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-y border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">이메일</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">닉네임</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">역할</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">가입일</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">상태</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{user.id}</td>
                <td className="px-4 py-3 text-gray-800">{user.email}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{user.nickname}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${
                    user.role === 'ADMIN' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role === 'ADMIN' ? '관리자' : '일반'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{user.createdAt}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${
                    user.isActive === 'Y' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.isActive === 'Y' ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-blue-600 hover:underline mr-3">상세</button>
                  {user.isActive === 'Y' ? (
                    <button className="text-orange-600 hover:underline">정지</button>
                  ) : (
                    <button className="text-green-600 hover:underline">해제</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserManagePage

