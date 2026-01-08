function AdminDashboardPage() {
  // 더미 통계 데이터
  const stats = [
    { label: '전체 회원', value: 1234, color: 'bg-blue-500' },
    { label: '전체 게시글', value: 567, color: 'bg-green-500' },
    { label: '오늘 가입', value: 12, color: 'bg-purple-500' },
    { label: '오늘 게시글', value: 34, color: 'bg-orange-500' },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">관리자 대시보드</h2>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <span className="text-white text-lg font-bold">{stat.value > 100 ? '📊' : '📈'}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 최근 활동 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">최근 활동</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-gray-600">새 회원 가입: user123</span>
            <span className="text-gray-400 ml-auto">5분 전</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span className="text-gray-600">새 게시글 작성: "독서 모임 후기"</span>
            <span className="text-gray-400 ml-auto">12분 전</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span className="text-gray-600">신고 접수: 부적절한 게시글</span>
            <span className="text-gray-400 ml-auto">1시간 전</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage

